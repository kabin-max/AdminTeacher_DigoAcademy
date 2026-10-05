'use server';

import { revalidatePath } from 'next/cache';

import {
  canTransition,
  findTransition,
  type CourseAction,
  type CourseStatus,
} from '@/features/courses/lifecycle';
import {
  courseDetailsSchema,
  lessonContentSchema,
  lessonSchema,
  quizSchema,
  sectionSchema,
  type CourseDetailsInput,
  type LessonContentInput,
  type LessonInput,
  type QuizInput,
  type SectionInput,
} from '@/features/courses/schemas';
import { recordAudit } from '@/lib/audit';
import { authorize, getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { isS3Configured, presignDownload } from '@/lib/storage';
import { ROLES, type Role } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}
export interface CreateResult extends ActionResult {
  courseId?: string;
}

const toCents = (price: number) => Math.round(price * 100);
const emptyToNull = (value: string | undefined) => (value && value.length > 0 ? value : null);

const isAdminSession = (session: { user: { role?: string | null } }) =>
  session.user.role === ROLES.ADMIN;

/**
 * Load a course the caller is allowed to manage. Admins are super-users and can
 * manage any course; instructors only their own.
 */
async function manageableCourse(
  courseId: string,
  session: { user: { id: string; role?: string | null } }
) {
  return isAdminSession(session)
    ? db.course.findUnique({ where: { id: courseId } })
    : db.course.findFirst({ where: { id: courseId, instructorId: session.user.id } });
}

/** Flag a published course for admin re-review after a substantive change. */
async function flagReReviewIfPublished(courseId: string, status: CourseStatus) {
  if (status === 'PUBLISHED') {
    await db.course.update({ where: { id: courseId }, data: { reReviewFlagged: true } });
  }
}

// ---------------------------------------------------------------------------
// Course details
// ---------------------------------------------------------------------------

export async function createCourse(input: CourseDetailsInput): Promise<CreateResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = courseDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check the form and try again.' };
  const d = parsed.data;

  const course = await db.course.create({
    data: {
      title: d.title,
      subtitle: emptyToNull(d.subtitle),
      description: emptyToNull(d.description),
      categoryId: emptyToNull(d.categoryId),
      difficulty: d.difficulty,
      language: d.language,
      priceCents: toCents(d.price),
      originalPriceCents: d.originalPrice != null ? toCents(d.originalPrice) : null,
      isPromo: d.isPromo ?? false,
      thumbnailKey: emptyToNull(d.thumbnailKey),
      introVideoKey: emptyToNull(d.introVideoKey),
      instructorId: (isAdminSession(session) && d.instructorId) ? d.instructorId : session.user.id,
    },
  });

  revalidatePath('/instructor/courses');
  return { ok: true, courseId: course.id };
}

export async function updateCourseDetails(
  courseId: string,
  input: CourseDetailsInput
): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const existing = await manageableCourse(courseId, session);
  if (!existing) return { ok: false, error: 'Course not found.' };

  const parsed = courseDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check the form and try again.' };
  const d = parsed.data;

  const priceCents = toCents(d.price);
  const substantiveChange =
    existing.title !== d.title ||
    existing.priceCents !== priceCents ||
    (existing.description ?? '') !== (d.description ?? '');

  await db.course.update({
    where: { id: courseId },
    data: {
      title: d.title,
      subtitle: emptyToNull(d.subtitle),
      description: emptyToNull(d.description),
      categoryId: emptyToNull(d.categoryId),
      difficulty: d.difficulty,
      language: d.language,
      priceCents,
      originalPriceCents: d.originalPrice != null ? toCents(d.originalPrice) : null,
      isPromo: d.isPromo ?? false,
      thumbnailKey: emptyToNull(d.thumbnailKey),
      introVideoKey: emptyToNull(d.introVideoKey),
      ...(isAdminSession(session) && d.instructorId ? { instructorId: d.instructorId } : {}),
      ...(existing.status === 'PUBLISHED' && substantiveChange ? { reReviewFlagged: true } : {}),
    },
  });

  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath('/instructor/courses');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Curriculum (sections + lessons) — editing curriculum is a substantive change.
// ---------------------------------------------------------------------------

export async function bulkImportCurriculum(courseId: string, text: string): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  const course = await manageableCourse(courseId, session);
  if (!course) return { ok: false, error: 'Course not found.' };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, error: 'Input is empty.' };

  try {
    await db.$transaction(
      async (tx) => {
        let currentSection: any = null;
        let sectionOrder = await tx.section.count({ where: { courseId } });
        let lessonOrder = 0;
        const allLessonsToCreate: any[] = [];

        for (const line of lines) {
          if (line.startsWith('-') || line.startsWith('*')) {
            if (!currentSection) throw new Error('Lesson must be under a section. Add a section title first.');
            const lessonTitle = line.replace(/^[-*]/, '').trim();
            allLessonsToCreate.push({
              sectionId: currentSection.id,
              title: lessonTitle,
              type: 'NOTE',
              order: lessonOrder++,
            });
          } else {
            const sectionTitle = line.replace(/^\d+\.\s*/, '').trim();
            currentSection = await tx.section.create({
              data: { courseId, title: sectionTitle, order: sectionOrder++ }
            });
            lessonOrder = 0;
          }
        }

        if (allLessonsToCreate.length > 0) {
          await tx.lesson.createMany({ data: allLessonsToCreate });
        }
      },
      { timeout: 30000 } // 30 second timeout for large imports
    );
  } catch (e: any) {
    return { ok: false, error: e.message || 'Failed to import curriculum.' };
  }

  await flagReReviewIfPublished(courseId, course.status as CourseStatus);
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}

export async function addSection(courseId: string, input: SectionInput): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  const course = await manageableCourse(courseId, session);
  if (!course) return { ok: false, error: 'Course not found.' };

  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Section title is required.' };

  const count = await db.section.count({ where: { courseId } });
  await db.section.create({ data: { courseId, title: parsed.data.title, order: count } });
  await flagReReviewIfPublished(courseId, course.status as CourseStatus);

  revalidatePath(`/instructor/courses/${courseId}`);
  return { ok: true };
}

export async function deleteSection(sectionId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  const section = await db.section.findUnique({ where: { id: sectionId }, include: { course: true } });
  if (!section || (!isAdminSession(session) && section.course.instructorId !== session.user.id)) {
    return { ok: false, error: 'Section not found.' };
  }

  await db.section.delete({ where: { id: sectionId } });
  await flagReReviewIfPublished(section.courseId, section.course.status as CourseStatus);

  revalidatePath(`/instructor/courses/${section.courseId}`);
  return { ok: true };
}

export async function addLesson(sectionId: string, input: LessonInput): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  const section = await db.section.findUnique({ where: { id: sectionId }, include: { course: true } });
  if (!section || (!isAdminSession(session) && section.course.instructorId !== session.user.id)) {
    return { ok: false, error: 'Section not found.' };
  }

  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check the lesson and try again.' };
  const d = parsed.data;

  const count = await db.lesson.count({ where: { sectionId } });
  await db.lesson.create({
    data: {
      sectionId,
      title: d.title,
      type: d.type,
      order: count,
      videoKey: emptyToNull(d.videoKey),
      videoDurationSec: d.videoDurationSec ?? null,
      noteContent: emptyToNull(d.noteContent),
      notePdfKey: emptyToNull(d.notePdfKey),
    },
  });
  await flagReReviewIfPublished(section.courseId, section.course.status as CourseStatus);

  revalidatePath(`/instructor/courses/${section.courseId}`);
  return { ok: true };
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });
  if (!lesson || (!isAdminSession(session) && lesson.section.course.instructorId !== session.user.id)) {
    return { ok: false, error: 'Lesson not found.' };
  }

  await db.lesson.delete({ where: { id: lessonId } });
  await flagReReviewIfPublished(lesson.section.courseId, lesson.section.course.status as CourseStatus);

  revalidatePath(`/instructor/courses/${lesson.section.courseId}`);
  return { ok: true };
}

/**
 * Attach content to an existing lesson — a recorded video (+ duration) for VIDEO
 * lessons, or rich-text notes and/or a PDF for NOTE lessons. Owner/admin only;
 * editing content on a published course flags it for re-review.
 */
export async function updateLessonContent(
  lessonId: string,
  input: LessonContentInput
): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });
  if (!lesson || (!isAdminSession(session) && lesson.section.course.instructorId !== session.user.id)) {
    return { ok: false, error: 'Lesson not found.' };
  }

  const parsed = lessonContentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check the lesson content and try again.' };
  const d = parsed.data;

  await db.lesson.update({
    where: { id: lessonId },
    data: {
      videoKey: emptyToNull(d.videoKey),
      videoDurationSec: d.videoDurationSec ?? null,
      noteContent: emptyToNull(d.noteContent),
      notePdfKey: emptyToNull(d.notePdfKey),
    },
  });
  await flagReReviewIfPublished(lesson.section.courseId, lesson.section.course.status as CourseStatus);

  revalidatePath(`/instructor/courses/${lesson.section.courseId}`);
  revalidatePath(`/admin/courses/${lesson.section.courseId}`);
  return { ok: true };
}

export async function getLessonVideoPreviewUrl(videoKey: string | null): Promise<string | null> {
  if (!videoKey || !videoKey.trim()) return null;
  const trimmed = videoKey.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (!isS3Configured) return null;
  try {
    return await presignDownload(trimmed);
  } catch {
    return null;
  }
}

/**
 * Author (create or replace) the quiz attached to a QUIZ lesson. Owner/admin
 * only. Questions and choices are replaced wholesale for simplicity; editing a
 * quiz on a published course flags it for re-review.
 */
export async function upsertQuiz(lessonId: string, input: QuizInput): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });
  if (!lesson || (!isAdminSession(session) && lesson.section.course.instructorId !== session.user.id)) {
    return { ok: false, error: 'Lesson not found.' };
  }
  if (lesson.type !== 'QUIZ') return { ok: false, error: 'This lesson is not a quiz.' };

  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the quiz and try again.' };
  }
  const d = parsed.data;

  await db.$transaction(async (tx) => {
    const quiz = await tx.quiz.upsert({
      where: { lessonId },
      create: {
        lessonId,
        title: d.title,
        description: emptyToNull(d.description),
        passingScore: d.passingScore,
        timeLimitSec: d.timeLimitSec ?? null,
      },
      update: {
        title: d.title,
        description: emptyToNull(d.description),
        passingScore: d.passingScore,
        timeLimitSec: d.timeLimitSec ?? null,
      },
    });

    // Replace the question pool wholesale (choices + any attempt answers cascade).
    await tx.question.deleteMany({ where: { quizId: quiz.id } });
    for (const [index, question] of d.questions.entries()) {
      await tx.question.create({
        data: {
          quizId: quiz.id,
          prompt: question.prompt,
          explanation: emptyToNull(question.explanation),
          kind: question.kind,
          order: index,
          choices: {
            create: question.choices.map((choice) => ({
              text: choice.text,
              isCorrect: choice.isCorrect,
            })),
          },
        },
      });
    }
  });

  await flagReReviewIfPublished(lesson.section.courseId, lesson.section.course.status as CourseStatus);
  revalidatePath(`/instructor/courses/${lesson.section.courseId}`);
  revalidatePath(`/admin/courses/${lesson.section.courseId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Lifecycle transitions (guarded + audited) — instructor & admin.
// ---------------------------------------------------------------------------

export async function transitionCourse(
  courseId: string,
  action: CourseAction
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Not authorized.' };
  const role = session.user.role as Role;

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return { ok: false, error: 'Course not found.' };

  const isOwner = course.instructorId === session.user.id;
  const from = course.status as CourseStatus;

  if (!canTransition(action, from, role, isOwner)) {
    return { ok: false, error: 'That action is not allowed for this course.' };
  }
  const transition = findTransition(action, from)!;

  await db.course.update({
    where: { id: courseId },
    data: {
      status: transition.to,
      // Publishing clears any outstanding re-review flag and cuts a new revision.
      ...(transition.to === 'PUBLISHED' ? { reReviewFlagged: false, version: { increment: 1 } } : {}),
    },
  });

  await recordAudit({
    actorId: session.user.id,
    action: `course.${action}`,
    entityType: 'Course',
    entityId: courseId,
    metadata: { from, to: transition.to },
  });

  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath('/instructor/courses');
  revalidatePath('/admin/courses');
  return { ok: true };
}

/** Admin acknowledges a re-review flag on a still-published course. */
export async function clearReReviewFlag(courseId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return { ok: false, error: 'Course not found.' };

  await db.course.update({ where: { id: courseId }, data: { reReviewFlagged: false } });
  await recordAudit({
    actorId: session.user.id,
    action: 'course.reReviewCleared',
    entityType: 'Course',
    entityId: courseId,
  });

  revalidatePath('/admin/courses');
  return { ok: true };
}

/**
 * Delete a course (admin super-user only). Guarded: a course wired into live
 * operations — enrollments, batches, or learning plans — cannot be deleted
 * because doing so cascades and would wipe that student/cohort data. The admin
 * must reassign/remove those first. A course's own content (sections, lessons)
 * cascades and is expected to go with it.
 */
export async function deleteCourse(courseId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      _count: { select: { enrollments: true, batches: true, learningPlans: true } },
    },
  });
  if (!course) return { ok: false, error: 'Course not found.' };

  const blockers: string[] = [];
  if (course._count.enrollments > 0) {
    blockers.push(`${course._count.enrollments} enrollment(s)`);
  }
  if (course._count.batches > 0) {
    blockers.push(`${course._count.batches} batch(es)`);
  }
  if (course._count.learningPlans > 0) {
    blockers.push(`${course._count.learningPlans} learning plan(s)`);
  }
  if (blockers.length > 0) {
    return {
      ok: false,
      error: `This course still has ${blockers.join(', ')}. Reassign or remove them before deleting.`,
    };
  }

  await db.course.delete({ where: { id: courseId } });
  await recordAudit({
    actorId: session.user.id,
    action: 'course.deleted',
    entityType: 'Course',
    entityId: courseId,
    metadata: { title: course.title, instructorId: course.instructorId },
  });

  revalidatePath('/admin/courses');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Cloning — duplicate structure into a fresh DRAFT (no student data carried).
// ---------------------------------------------------------------------------

export async function cloneCourse(courseId: string): Promise<CreateResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const source = await db.course.findFirst({
    where: isAdminSession(session) ? { id: courseId } : { id: courseId, instructorId: session.user.id },
    include: { sections: { include: { lessons: true }, orderBy: { order: 'asc' } } },
  });
  if (!source) return { ok: false, error: 'Course not found.' };

  const clone = await db.course.create({
    data: {
      title: `${source.title} (copy)`,
      subtitle: source.subtitle,
      description: source.description,
      thumbnailKey: source.thumbnailKey,
      language: source.language,
      difficulty: source.difficulty,
      priceCents: source.priceCents,
      currency: source.currency,
      categoryId: source.categoryId,
      // Preserve the original author (so an admin clone stays with its instructor).
      instructorId: source.instructorId,
      clonedFromId: source.id,
      status: 'DRAFT',
      sections: {
        create: source.sections.map((section) => ({
          title: section.title,
          order: section.order,
          lessons: {
            create: section.lessons.map((lesson) => ({
              title: lesson.title,
              type: lesson.type,
              order: lesson.order,
              videoKey: lesson.videoKey,
              videoDurationSec: lesson.videoDurationSec,
              noteContent: lesson.noteContent,
              notePdfKey: lesson.notePdfKey,
            })),
          },
        })),
      },
    },
  });

  await recordAudit({
    actorId: session.user.id,
    action: 'course.cloned',
    entityType: 'Course',
    entityId: clone.id,
    metadata: { from: source.id },
  });

  revalidatePath('/instructor/courses');
  return { ok: true, courseId: clone.id };
}
