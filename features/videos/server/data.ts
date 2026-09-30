import 'server-only';

import { db } from '@/lib/db';
import { isS3Configured, presignDownload } from '@/lib/storage';

export interface VideoOverview {
  id: string;
  title: string;
  courseTitle: string;
  sectionTitle?: string;
  batchName?: string;
  durationMin?: number | null;
  videoUrl: string | null;
  createdAt: string;
  instructorName?: string;
}

async function sign(key: string | null): Promise<string | null> {
  if (!key || !key.trim()) return null;
  const str = key.trim();
  if (str.startsWith('http://') || str.startsWith('https://')) return str;
  if (!isS3Configured) return null;
  try {
    return await presignDownload(str);
  } catch {
    return null;
  }
}

/** All course videos & batch videos authored by an instructor. */
export async function getInstructorVideos(instructorId: string): Promise<VideoOverview[]> {
  const [courseLessons, batchVideos] = await Promise.all([
    db.lesson.findMany({
      where: { type: 'VIDEO', videoKey: { not: null }, section: { course: { instructorId } } },
      include: {
        section: { select: { title: true, course: { select: { title: true } } } },
      },
    }),
    db.batchVideo.findMany({
      where: { batch: { instructorId } },
      include: {
        batch: { select: { name: true, course: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const lessonItems = await Promise.all(
    courseLessons.map(async (l) => ({
      id: l.id,
      title: l.title,
      courseTitle: l.section.course.title,
      sectionTitle: l.section.title,
      durationMin: l.videoDurationSec ? Math.round(l.videoDurationSec / 60) : null,
      videoUrl: await sign(l.videoKey),
      createdAt: new Date().toISOString(),
    }))
  );

  const batchItems = await Promise.all(
    batchVideos.map(async (v) => ({
      id: v.id,
      title: v.title,
      courseTitle: v.batch.course.title,
      batchName: v.batch.name,
      videoUrl: await sign(v.videoKey),
      createdAt: v.createdAt.toISOString(),
    }))
  );

  return [...lessonItems, ...batchItems];
}

/** All videos available to an enrolled student. */
export async function getStudentVideos(studentId: string): Promise<VideoOverview[]> {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    select: { courseId: true, batchId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  const batchIds = enrollments.map((e) => e.batchId).filter((id): id is string => Boolean(id));

  if (courseIds.length === 0) return [];

  const [courseLessons, batchVideos] = await Promise.all([
    db.lesson.findMany({
      where: { type: 'VIDEO', videoKey: { not: null }, section: { courseId: { in: courseIds } } },
      include: {
        section: {
          select: {
            title: true,
            course: { select: { title: true, instructor: { select: { name: true } } } },
          },
        },
      },
    }),
    batchIds.length > 0
      ? db.batchVideo.findMany({
          where: { batchId: { in: batchIds } },
          include: {
            batch: { select: { name: true, course: { select: { title: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [],
  ]);

  const lessonItems = await Promise.all(
    courseLessons.map(async (l) => ({
      id: l.id,
      title: l.title,
      courseTitle: l.section.course.title,
      sectionTitle: l.section.title,
      instructorName: l.section.course.instructor.name,
      durationMin: l.videoDurationSec ? Math.round(l.videoDurationSec / 60) : null,
      videoUrl: await sign(l.videoKey),
      createdAt: new Date().toISOString(),
    }))
  );

  const batchItems = await Promise.all(
    batchVideos.map(async (v) => ({
      id: v.id,
      title: v.title,
      courseTitle: v.batch.course.title,
      batchName: v.batch.name,
      videoUrl: await sign(v.videoKey),
      createdAt: v.createdAt.toISOString(),
    }))
  );

  return [...batchItems, ...lessonItems];
}

/** All videos in the platform for admin. */
export async function getAdminVideos(): Promise<VideoOverview[]> {
  const [courseLessons, batchVideos] = await Promise.all([
    db.lesson.findMany({
      where: { type: 'VIDEO', videoKey: { not: null } },
      include: {
        section: {
          select: {
            title: true,
            course: { select: { title: true, instructor: { select: { name: true } } } },
          },
        },
      },
    }),
    db.batchVideo.findMany({
      include: {
        batch: { select: { name: true, course: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const lessonItems = await Promise.all(
    courseLessons.map(async (l) => ({
      id: l.id,
      title: l.title,
      courseTitle: l.section.course.title,
      sectionTitle: l.section.title,
      instructorName: l.section.course.instructor.name,
      durationMin: l.videoDurationSec ? Math.round(l.videoDurationSec / 60) : null,
      videoUrl: await sign(l.videoKey),
      createdAt: new Date().toISOString(),
    }))
  );

  const batchItems = await Promise.all(
    batchVideos.map(async (v) => ({
      id: v.id,
      title: v.title,
      courseTitle: v.batch.course.title,
      batchName: v.batch.name,
      videoUrl: await sign(v.videoKey),
      createdAt: v.createdAt.toISOString(),
    }))
  );

  return [...batchItems, ...lessonItems];
}

export interface BatchOption {
  id: string;
  name: string;
  courseTitle: string;
}

export interface CourseOptionWithSections {
  id: string;
  title: string;
  sections: { id: string; title: string }[];
}

export async function getInstructorBatchAndCourseOptions(
  instructorId: string,
  isAdmin = false
): Promise<{ courses: CourseOptionWithSections[]; batches: BatchOption[] }> {
  const [courses, batches] = await Promise.all([
    db.course.findMany({
      where: isAdmin ? {} : { instructorId },
      select: {
        id: true,
        title: true,
        sections: { select: { id: true, title: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { title: 'asc' },
    }),
    db.batch.findMany({
      where: isAdmin ? {} : { instructorId },
      select: { id: true, name: true, course: { select: { title: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    courses,
    batches: batches.map((b) => ({ id: b.id, name: b.name, courseTitle: b.course.title })),
  };
}
