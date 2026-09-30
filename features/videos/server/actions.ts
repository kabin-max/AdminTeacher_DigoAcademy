'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
  videoId?: string;
}

const createStandaloneVideoSchema = z.object({
  targetType: z.enum(['BATCH', 'COURSE']),
  batchId: z.string().optional(),
  courseId: z.string().optional(),
  sectionId: z.string().optional(),
  newSectionTitle: z.string().optional(),
  title: z.string().trim().min(1, 'Video title is required.'),
  videoKey: z.string().trim().min(1, 'Video file or URL is required.'),
  durationMin: z.number().optional(),
});

export type CreateStandaloneVideoInput = z.infer<typeof createStandaloneVideoSchema>;

export async function createStandaloneVideo(
  input: CreateStandaloneVideoInput
): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createStandaloneVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;
  const isAdmin = session.user.role === ROLES.ADMIN;

  if (data.targetType === 'BATCH') {
    if (!data.batchId) return { ok: false, error: 'Batch is required.' };
    const batch = await db.batch.findFirst({
      where: isAdmin ? { id: data.batchId } : { id: data.batchId, instructorId: session.user.id },
      select: { id: true },
    });
    if (!batch) return { ok: false, error: 'Batch not found or unauthorized.' };

    const video = await db.batchVideo.create({
      data: { batchId: data.batchId, title: data.title, videoKey: data.videoKey },
    });

    await recordAudit({
      actorId: session.user.id,
      action: 'batchVideo.created',
      entityType: 'BatchVideo',
      entityId: video.id,
      metadata: { batchId: data.batchId, title: data.title },
    });

    revalidatePath('/instructor/videos');
    revalidatePath('/admin/videos');
    return { ok: true, videoId: video.id };
  }

  // Course Video Lesson
  if (!data.courseId) return { ok: false, error: 'Course is required.' };
  const course = await db.course.findFirst({
    where: isAdmin ? { id: data.courseId } : { id: data.courseId, instructorId: session.user.id },
    select: { id: true },
  });
  if (!course) return { ok: false, error: 'Course not found or unauthorized.' };

  let sectionId = data.sectionId;
  if (!sectionId) {
    const sectionTitle = data.newSectionTitle?.trim() || 'Course Videos';
    const existingSection = await db.section.findFirst({
      where: { courseId: data.courseId, title: sectionTitle },
      select: { id: true },
    });

    if (existingSection) {
      sectionId = existingSection.id;
    } else {
      const sectionCount = await db.section.count({ where: { courseId: data.courseId } });
      const createdSection = await db.section.create({
        data: { courseId: data.courseId, title: sectionTitle, order: sectionCount },
      });
      sectionId = createdSection.id;
    }
  }

  const lessonCount = await db.lesson.count({ where: { sectionId } });
  const videoDurationSec = data.durationMin ? Math.round(data.durationMin * 60) : null;

  const lesson = await db.lesson.create({
    data: {
      sectionId,
      title: data.title,
      type: 'VIDEO',
      order: lessonCount,
      videoKey: data.videoKey,
      videoDurationSec,
    },
  });

  await recordAudit({
    actorId: session.user.id,
    action: 'lessonVideo.created',
    entityType: 'Lesson',
    entityId: lesson.id,
    metadata: { courseId: data.courseId, title: data.title },
  });

  revalidatePath('/instructor/videos');
  revalidatePath('/admin/videos');
  revalidatePath(`/instructor/courses/${data.courseId}`);
  return { ok: true, videoId: lesson.id };
}

export async function deleteVideo(videoId: string, type: 'BATCH' | 'LESSON'): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const isAdmin = session.user.role === ROLES.ADMIN;

  if (type === 'BATCH') {
    const video = await db.batchVideo.findUnique({
      where: { id: videoId },
      include: { batch: { select: { instructorId: true } } },
    });

    if (!video) return { ok: false, error: 'Video not found.' };
    if (!isAdmin && video.batch.instructorId !== session.user.id) {
      return { ok: false, error: 'Not authorized to delete this video.' };
    }

    await db.batchVideo.delete({ where: { id: videoId } });
    await recordAudit({
      actorId: session.user.id,
      action: 'batchVideo.deleted',
      entityType: 'BatchVideo',
      entityId: videoId,
      metadata: { title: video.title },
    });
  } else {
    const lesson = await db.lesson.findUnique({
      where: { id: videoId },
      include: { section: { include: { course: { select: { instructorId: true } } } } },
    });

    if (!lesson) return { ok: false, error: 'Video lesson not found.' };
    if (!isAdmin && lesson.section.course.instructorId !== session.user.id) {
      return { ok: false, error: 'Not authorized to delete this video.' };
    }

    await db.lesson.delete({ where: { id: videoId } });
    await recordAudit({
      actorId: session.user.id,
      action: 'lessonVideo.deleted',
      entityType: 'Lesson',
      entityId: videoId,
      metadata: { title: lesson.title },
    });
  }

  revalidatePath('/instructor/videos');
  revalidatePath('/admin/videos');
  return { ok: true };
}

export async function renameVideo(videoId: string, type: 'BATCH' | 'LESSON', newTitle: string): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (!newTitle.trim()) return { ok: false, error: 'Title is required.' };

  const isAdmin = session.user.role === ROLES.ADMIN;

  if (type === 'BATCH') {
    const video = await db.batchVideo.findUnique({
      where: { id: videoId },
      include: { batch: { select: { instructorId: true } } },
    });

    if (!video) return { ok: false, error: 'Video not found.' };
    if (!isAdmin && video.batch.instructorId !== session.user.id) {
      return { ok: false, error: 'Not authorized to edit this video.' };
    }

    await db.batchVideo.update({ where: { id: videoId }, data: { title: newTitle.trim() } });
    await recordAudit({
      actorId: session.user.id,
      action: 'batchVideo.renamed',
      entityType: 'BatchVideo',
      entityId: videoId,
      metadata: { oldTitle: video.title, newTitle: newTitle.trim() },
    });
  } else {
    const lesson = await db.lesson.findUnique({
      where: { id: videoId },
      include: { section: { include: { course: { select: { instructorId: true } } } } },
    });

    if (!lesson) return { ok: false, error: 'Video lesson not found.' };
    if (!isAdmin && lesson.section.course.instructorId !== session.user.id) {
      return { ok: false, error: 'Not authorized to edit this video.' };
    }

    await db.lesson.update({ where: { id: videoId }, data: { title: newTitle.trim() } });
    await recordAudit({
      actorId: session.user.id,
      action: 'lessonVideo.renamed',
      entityType: 'Lesson',
      entityId: videoId,
      metadata: { oldTitle: lesson.title, newTitle: newTitle.trim() },
    });
  }

  revalidatePath('/instructor/videos');
  revalidatePath('/admin/videos');
  return { ok: true };
}
