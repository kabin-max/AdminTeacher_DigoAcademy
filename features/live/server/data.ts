import 'server-only';

import { db } from '@/lib/db';
import { computeSchedule } from '@/lib/schedule';
import { isS3Configured, presignDownload } from '@/lib/storage';

async function sign(key: string | null): Promise<string | null> {
  if (!key || !isS3Configured) return null;
  try {
    return await presignDownload(key);
  } catch {
    return null;
  }
}

export interface LiveBatch {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  meetLink: string | null;
  nextOccurrence: string | null;
  isLive: boolean;
}

export interface RecordedClassVideo {
  id: string;
  title: string;
  batchName: string;
  courseTitle: string;
  categoryName: string | null;
  createdAt: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
}

/**
 * A student's group-live batches with their recurring Meet link + next
 * occurrence, soonest first. Cheap — no video/S3 work — so it's also used for
 * the dashboard "next live class" widget.
 */
export async function getStudentUpcomingBatches(
  studentId: string
): Promise<{ featured: LiveBatch | null; upcoming: LiveBatch[] }> {
  const enrollments = await db.enrollment.findMany({
    where: { studentId, batchId: { not: null } },
    select: { batchId: true },
  });
  const batchIds = [...new Set(enrollments.map((e) => e.batchId).filter((id): id is string => Boolean(id)))];
  if (batchIds.length === 0) return { featured: null, upcoming: [] };

  const batches = await db.batch.findMany({
    where: { id: { in: batchIds } },
    include: {
      course: { select: { id: true, title: true } },
      instructor: { select: { name: true } },
    },
  });

  const liveBatches: LiveBatch[] = batches
    .map((b) => {
      const schedule = b.startDate
        ? computeSchedule(b.startDate, b.endDate)
        : { nextOccurrence: null, isLive: false };
      return {
        id: b.id,
        name: b.name,
        courseId: b.course.id,
        courseTitle: b.course.title,
        instructorName: b.instructor?.name ?? 'TBA',
        meetLink: b.meetLink,
        ...schedule,
      };
    })
    .sort((a, b) => {
      if (a.nextOccurrence && b.nextOccurrence) return a.nextOccurrence.localeCompare(b.nextOccurrence);
      if (a.nextOccurrence) return -1;
      if (b.nextOccurrence) return 1;
      return 0;
    });

  return { featured: liveBatches[0] ?? null, upcoming: liveBatches.slice(1) };
}

/**
 * Live-class portal data for a student: their batches (see
 * `getStudentUpcomingBatches`) plus the class-video archive across them.
 */
export async function getStudentLive(studentId: string): Promise<{
  featured: LiveBatch | null;
  upcoming: LiveBatch[];
  recorded: RecordedClassVideo[];
}> {
  const { featured, upcoming } = await getStudentUpcomingBatches(studentId);
  const batchIds = [featured, ...upcoming].filter((b): b is LiveBatch => b !== null).map((b) => b.id);
  if (batchIds.length === 0) return { featured: null, upcoming: [], recorded: [] };

  const videoRows = await db.batchVideo.findMany({
    where: { batchId: { in: batchIds } },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      batch: {
        include: { course: { select: { title: true, thumbnailKey: true, category: { select: { name: true } } } } },
      },
    },
  });
  const recorded: RecordedClassVideo[] = await Promise.all(
    videoRows.map(async (row) => ({
      id: row.id,
      title: row.title,
      batchName: row.batch.name,
      courseTitle: row.batch.course.title,
      categoryName: row.batch.course.category?.name ?? null,
      createdAt: row.createdAt.toISOString(),
      thumbnailUrl: await sign(row.batch.course.thumbnailKey),
      videoUrl: await sign(row.videoKey),
    }))
  );

  return { featured, upcoming, recorded };
}
