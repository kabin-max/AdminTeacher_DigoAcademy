import 'server-only';

import { db } from '@/lib/db';
import { computeSchedule } from '@/lib/schedule';
import { ROLES } from '@/shared/constants/roles';

/** All batches (cohorts) for the admin management list, newest first. */
export async function getBatches() {
  return db.batch.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
      instructor: { select: { id: true, name: true } },
      _count: { select: { enrollments: true, liveClasses: true } },
    },
  });
}

export type AdminBatch = Awaited<ReturnType<typeof getBatches>>[number];

/** A single batch for the detail/edit page, or null if it doesn't exist. */
export async function getBatch(id: string) {
  return db.batch.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      instructor: { select: { id: true, name: true } },
    },
  });
}

export type AdminBatchDetail = NonNullable<Awaited<ReturnType<typeof getBatch>>>;

/** An instructor's own batches, newest first. */
export async function getInstructorBatches(instructorId: string) {
  return db.batch.findMany({
    where: { instructorId },
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { enrollments: true } },
    },
  });
}

export type InstructorBatch = Awaited<ReturnType<typeof getInstructorBatches>>[number];

/** A single batch for the instructor detail/schedule page — only if they're
 * assigned to it — or null otherwise. */
export async function getInstructorBatch(id: string, instructorId: string) {
  return db.batch.findFirst({
    where: { id, instructorId },
    include: { course: { select: { id: true, title: true } } },
  });
}

export type InstructorBatchDetail = NonNullable<Awaited<ReturnType<typeof getInstructorBatch>>>;

export interface NextLiveClass {
  batchId: string;
  batchName: string;
  courseTitle: string;
  meetLink: string | null;
  nextOccurrence: string;
  isLive: boolean;
}

function pickNextLiveClass(
  batches: {
    id: string;
    name: string;
    startDate: Date | null;
    endDate: Date | null;
    meetLink: string | null;
    course: { title: string };
  }[]
): NextLiveClass | null {
  const candidates = batches
    .map((b) => {
      if (!b.startDate) return null;
      const schedule = computeSchedule(b.startDate, b.endDate);
      if (!schedule.nextOccurrence) return null;
      return {
        batchId: b.id,
        batchName: b.name,
        courseTitle: b.course.title,
        meetLink: b.meetLink,
        nextOccurrence: schedule.nextOccurrence,
        isLive: schedule.isLive,
      };
    })
    .filter((x): x is NextLiveClass => x !== null)
    .sort((a, b) => a.nextOccurrence.localeCompare(b.nextOccurrence));
  return candidates[0] ?? null;
}

/** The soonest upcoming live class across the whole platform (admin dashboard widget). */
export async function getNextLiveClassPlatformWide(): Promise<NextLiveClass | null> {
  const batches = await db.batch.findMany({
    where: { startDate: { not: null } },
    select: { id: true, name: true, startDate: true, endDate: true, meetLink: true, course: { select: { title: true } } },
  });
  return pickNextLiveClass(batches);
}

/** The soonest upcoming live class among an instructor's own batches. */
export async function getNextLiveClassForInstructor(instructorId: string): Promise<NextLiveClass | null> {
  const batches = await db.batch.findMany({
    where: { instructorId, startDate: { not: null } },
    select: { id: true, name: true, startDate: true, endDate: true, meetLink: true, course: { select: { title: true } } },
  });
  return pickNextLiveClass(batches);
}

/** All learning plans for the admin management list, newest first. */
export async function getLearningPlans() {
  return db.learningPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { enrollments: true } },
    },
  });
}

export type AdminLearningPlan = Awaited<ReturnType<typeof getLearningPlans>>[number];

/** Minimal course list for cohort assignment selects. */
export async function getCourseChoices() {
  return db.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } });
}

/** Instructors for the batch instructor select. */
export async function getInstructorChoices() {
  return db.user.findMany({
    where: { role: ROLES.INSTRUCTOR },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}
