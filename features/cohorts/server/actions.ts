'use server';

import { revalidatePath } from 'next/cache';

import {
  createBatchSchema,
  createLearningPlanSchema,
  updateBatchScheduleSchema,
  updateBatchSchema,
  updateLearningPlanSchema,
  type CreateBatchInput,
  type CreateLearningPlanInput,
  type UpdateBatchInput,
  type UpdateBatchScheduleInput,
  type UpdateLearningPlanInput,
} from '@/features/cohorts/schemas';
import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { createRecurringMeetEvent, deleteMeetEvent, isMeetConfigured, syncBatchMeetAttendees, updateRecurringMeetEvent } from '@/lib/meet';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------

const isAdminSession = (session: { user: { role?: string | null } }) =>
  session.user.role === ROLES.ADMIN;

async function assertCourse(courseId: string) {
  return db.course.findUnique({ where: { id: courseId }, select: { id: true } });
}

async function assertInstructor(instructorId: string) {
  return db.user.findFirst({
    where: { id: instructorId, role: ROLES.INSTRUCTOR },
    select: { id: true, email: true },
  });
}

/**
 * Creates the batch's one recurring weekly Meet link (day/time anchored to
 * `startDate`, bounded by `endDate`). Best-effort: Google/Calendar failures are
 * logged, never block batch creation — a batch can exist without a live link
 * and get one later once Calendar is connected.
 */
async function createBatchMeetLink(
  name: string,
  startDate: Date | null,
  endDate: Date | null,
  instructorEmail?: string
): Promise<{ meetLink: string; googleEventId: string } | null> {
  if (!isMeetConfigured || !startDate) return null;
  try {
    return await createRecurringMeetEvent({
      title: `${name} — Live class`,
      startTime: startDate,
      durationMin: 60,
      untilDate: endDate,
      instructorEmail,
    });
  } catch (error) {
    console.error('batch: create Meet link failed', error);
    return null;
  }
}

export async function createBatch(input: CreateBatchInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { name, courseId, instructorId, startDate, endDate, capacity } = parsed.data;

  if (!(await assertCourse(courseId))) return { ok: false, error: 'Course not found.' };
  let instructorEmail: string | undefined;
  if (instructorId) {
    const inst = await assertInstructor(instructorId);
    if (!inst) return { ok: false, error: 'Instructor not found.' };
    instructorEmail = inst.email;
  }

  const meet = await createBatchMeetLink(name, startDate, endDate, instructorEmail);

  const batch = await db.batch.create({
    data: {
      name,
      courseId,
      instructorId,
      startDate,
      endDate,
      capacity,
      meetLink: meet?.meetLink,
      googleEventId: meet?.googleEventId,
    },
  });

  void syncBatchMeetAttendees(batch.id);

  await recordAudit({
    actorId: session.user.id,
    action: 'batch.created',
    entityType: 'Batch',
    entityId: batch.id,
    metadata: { name, courseId },
  });

  revalidatePath('/admin/batches');
  return { ok: true };
}

/**
 * Syncs the batch's recurring Meet event to a new name/startDate/endDate: updates
 * it in place when one exists, creates one if a start date was just added, or
 * drops the link if the start date was cleared. Best-effort — Calendar failures
 * are logged, never block saving the batch.
 */
async function syncBatchMeetLink(
  name: string,
  startDate: Date | null,
  endDate: Date | null,
  existing: { meetLink: string | null; googleEventId: string | null },
  instructorEmail?: string
): Promise<{ meetLink: string | null; googleEventId: string | null }> {
  let meetLink = existing.meetLink;
  let googleEventId = existing.googleEventId;
  try {
    if (existing.googleEventId && startDate) {
      await updateRecurringMeetEvent(existing.googleEventId, {
        title: `${name} — Live class`,
        startTime: startDate,
        durationMin: 60,
        untilDate: endDate,
        instructorEmail,
      });
    } else if (existing.googleEventId && !startDate) {
      await deleteMeetEvent(existing.googleEventId);
      meetLink = null;
      googleEventId = null;
    } else if (!existing.googleEventId) {
      const meet = await createBatchMeetLink(name, startDate, endDate, instructorEmail);
      if (meet) {
        meetLink = meet.meetLink;
        googleEventId = meet.googleEventId;
      }
    }
  } catch (error) {
    console.error('batch: sync Meet link failed', error);
  }
  return { meetLink, googleEventId };
}

export async function updateBatch(input: UpdateBatchInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = updateBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { id, name, courseId, instructorId, startDate, endDate, capacity } = parsed.data;

  const existing = await db.batch.findUnique({
    where: { id },
    select: { meetLink: true, googleEventId: true },
  });
  if (!existing) return { ok: false, error: 'Batch not found.' };
  if (!(await assertCourse(courseId))) return { ok: false, error: 'Course not found.' };

  let instructorEmail: string | undefined;
  if (instructorId) {
    const inst = await assertInstructor(instructorId);
    if (!inst) return { ok: false, error: 'Instructor not found.' };
    instructorEmail = inst.email;
  }

  const { meetLink, googleEventId } = await syncBatchMeetLink(name, startDate, endDate, existing, instructorEmail);

  await db.batch.update({
    where: { id },
    data: { name, courseId, instructorId, startDate, endDate, capacity, meetLink, googleEventId },
  });

  void syncBatchMeetAttendees(id);

  await recordAudit({
    actorId: session.user.id,
    action: 'batch.updated',
    entityType: 'Batch',
    entityId: id,
  });

  revalidatePath('/admin/batches');
  revalidatePath(`/admin/batches/${id}`);
  return { ok: true };
}

/**
 * Instructor-facing: update only the batch's class schedule (which drives the
 * recurring Meet link) — not name/course/instructor/capacity. Admins can do this
 * for any batch; instructors only for a batch they're assigned to.
 */
export async function updateBatchSchedule(input: UpdateBatchScheduleInput): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = updateBatchScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { id, startDate, endDate } = parsed.data;

  const existing = await db.batch.findFirst({
    where: isAdminSession(session) ? { id } : { id, instructorId: session.user.id },
    select: { name: true, meetLink: true, googleEventId: true, instructor: { select: { email: true } } },
  });
  if (!existing) return { ok: false, error: 'Batch not found.' };

  const { meetLink, googleEventId } = await syncBatchMeetLink(existing.name, startDate, endDate, existing, existing.instructor?.email);

  await db.batch.update({ where: { id }, data: { startDate, endDate, meetLink, googleEventId } });

  void syncBatchMeetAttendees(id);

  await recordAudit({
    actorId: session.user.id,
    action: 'batch.scheduleUpdated',
    entityType: 'Batch',
    entityId: id,
  });

  revalidatePath('/admin/batches');
  revalidatePath(`/admin/batches/${id}`);
  revalidatePath(`/instructor/batches/${id}`);
  return { ok: true };
}

export async function deleteBatch(id: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const batch = await db.batch.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!batch) return { ok: false, error: 'Batch not found.' };
  if (batch._count.enrollments > 0) {
    return {
      ok: false,
      error: `${batch._count.enrollments} enrollment(s) are in this batch — reassign them first.`,
    };
  }

  if (batch.googleEventId) {
    try {
      await deleteMeetEvent(batch.googleEventId);
    } catch (error) {
      console.error('batch: delete Meet link failed', error);
    }
  }

  await db.batch.delete({ where: { id } });
  await recordAudit({
    actorId: session.user.id,
    action: 'batch.deleted',
    entityType: 'Batch',
    entityId: id,
    metadata: { name: batch.name },
  });

  revalidatePath('/admin/batches');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Learning plans
// ---------------------------------------------------------------------------

export async function createLearningPlan(input: CreateLearningPlanInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createLearningPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { name, courseId, description } = parsed.data;
  if (!(await assertCourse(courseId))) return { ok: false, error: 'Course not found.' };

  const plan = await db.learningPlan.create({
    data: { name, courseId, description: description || null },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'learningPlan.created',
    entityType: 'LearningPlan',
    entityId: plan.id,
    metadata: { name, courseId },
  });

  revalidatePath('/admin/learning-plans');
  return { ok: true };
}

export async function updateLearningPlan(input: UpdateLearningPlanInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = updateLearningPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { id, name, courseId, description } = parsed.data;

  const existing = await db.learningPlan.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: 'Learning plan not found.' };
  if (!(await assertCourse(courseId))) return { ok: false, error: 'Course not found.' };

  await db.learningPlan.update({
    where: { id },
    data: { name, courseId, description: description || null },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'learningPlan.updated',
    entityType: 'LearningPlan',
    entityId: id,
  });

  revalidatePath('/admin/learning-plans');
  return { ok: true };
}

export async function deleteLearningPlan(id: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const plan = await db.learningPlan.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!plan) return { ok: false, error: 'Learning plan not found.' };
  if (plan._count.enrollments > 0) {
    return {
      ok: false,
      error: `${plan._count.enrollments} enrollment(s) use this plan — reassign them first.`,
    };
  }

  await db.learningPlan.delete({ where: { id } });
  await recordAudit({
    actorId: session.user.id,
    action: 'learningPlan.deleted',
    entityType: 'LearningPlan',
    entityId: id,
    metadata: { name: plan.name },
  });

  revalidatePath('/admin/learning-plans');
  return { ok: true };
}
