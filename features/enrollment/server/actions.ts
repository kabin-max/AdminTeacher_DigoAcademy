'use server';

import { randomBytes } from 'node:crypto';

import { APIError } from 'better-auth/api';
import { revalidatePath } from 'next/cache';

import {
  convertInquirySchema,
  createEnrollmentSchema,
  createGuestInquirySchema,
  createInquirySchema,
  recordPaymentSchema,
  type ConvertInquiryInput,
  type CreateEnrollmentInput,
  type CreateGuestInquiryInput,
  type CreateInquiryInput,
  type EnrollmentMode,
  type RecordPaymentInput,
} from '@/features/enrollment/schemas';
import {
  sendEnrolledEmail,
  sendInquiryApprovedEmail,
  sendInquiryReceivedEmail,
} from '@/features/enrollment/server/emails';
import { isOpen, nextStage, type InquiryStatus } from '@/features/enrollment/pipeline';
import { recordAudit } from '@/lib/audit';
import { auth } from '@/lib/auth';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { syncBatchMeetAttendees } from '@/lib/meet';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}
export interface EnrollmentResult extends ActionResult {
  enrollmentId?: string;
}

function revalidateEnrollment(enrollmentId?: string) {
  revalidatePath('/admin/enrollments');
  revalidatePath('/admin/payments');
  if (enrollmentId) revalidatePath(`/admin/enrollments/${enrollmentId}`);
}

// ---------------------------------------------------------------------------
// Student booking (marketplace entry point into the pipeline)
// ---------------------------------------------------------------------------

export interface InquiryResult extends ActionResult {
  inquiryId?: string;
}

/**
 * A student books a published course. Creates a NEW inquiry the admin then works.
 * Blocks duplicates: an existing enrollment or an open (non-terminal) inquiry for
 * the same course. Re-checks the student role independently (reachable via POST).
 */
export async function createInquiry(input: CreateInquiryInput): Promise<InquiryResult> {
  const session = await authorize(ROLES.STUDENT);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createInquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { courseId, mode, message } = parsed.data;
  const studentId = session.user.id;

  const course = await db.course.findFirst({
    where: { id: courseId, status: 'PUBLISHED' },
    select: { id: true, title: true },
  });
  if (!course) return { ok: false, error: 'Course is not available.' };

  const enrolled = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });
  if (enrolled) return { ok: false, error: 'You are already enrolled in this course.' };

  const openInquiry = await db.inquiry.findFirst({
    where: { studentId, courseId, status: { in: ['NEW', 'CONTACTED', 'CONFIRMED'] } },
    select: { id: true },
  });
  if (openInquiry) {
    return { ok: false, error: 'You already have a pending inquiry for this course.' };
  }

  const inquiry = await db.inquiry.create({
    data: { studentId, courseId, mode, message: message || null },
    select: { id: true },
  });
  await recordAudit({
    actorId: studentId,
    action: 'inquiry.created',
    entityType: 'Inquiry',
    entityId: inquiry.id,
    metadata: { courseId, mode },
  });

  await sendInquiryReceivedEmail({
    to: session.user.email,
    name: session.user.name,
    courseTitle: course.title,
    mode,
  });

  revalidatePath('/admin/inquiries');
  revalidatePath('/student/inquiries');
  revalidatePath(`/student/courses/${courseId}`);
  return { ok: true, inquiryId: inquiry.id };
}

/**
 * A guest books a published course from the public site — no auth. Captures their
 * contact details on the inquiry; the admin creates/links a student account when
 * converting it to an enrollment. Blocks obvious duplicates (an open request for
 * the same email + course, or an account already enrolled in it).
 */
export async function createGuestInquiry(input: CreateGuestInquiryInput): Promise<InquiryResult> {
  const parsed = createGuestInquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { courseId, mode, name, email, phone, message } = parsed.data;

  const course = await db.course.findFirst({
    where: { id: courseId, status: 'PUBLISHED' },
    select: { id: true, title: true },
  });
  if (!course) return { ok: false, error: 'Course is not available.' };

  const openInquiry = await db.inquiry.findFirst({
    where: { courseId, guestEmail: email, status: { in: ['NEW', 'CONTACTED', 'CONFIRMED'] } },
    select: { id: true },
  });
  if (openInquiry) {
    return {
      ok: false,
      error: 'We already have your request for this course — our team will reach out shortly.',
    };
  }

  const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    const enrolled = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: existingUser.id, courseId } },
      select: { id: true },
    });
    if (enrolled) {
      return { ok: false, error: 'An account with this email is already enrolled in this course.' };
    }
  }

  const inquiry = await db.inquiry.create({
    data: {
      courseId,
      mode,
      guestName: name,
      guestEmail: email,
      guestPhone: phone || null,
      message: message || null,
    },
    select: { id: true },
  });
  await recordAudit({
    actorId: existingUser?.id ?? null,
    action: 'inquiry.created',
    entityType: 'Inquiry',
    entityId: inquiry.id,
    metadata: { courseId, mode, guest: true, email },
  });

  await sendInquiryReceivedEmail({ to: email, name, courseTitle: course.title, mode });

  revalidatePath('/admin/inquiries');
  return { ok: true, inquiryId: inquiry.id };
}

// ---------------------------------------------------------------------------
// Inquiry pipeline
// ---------------------------------------------------------------------------

/** Move an inquiry to the next open stage (NEW -> CONTACTED -> CONFIRMED). */
export async function advanceInquiry(inquiryId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const inquiry = await db.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      student: { select: { email: true, name: true } },
      course: { select: { title: true } },
    },
  });
  if (!inquiry) return { ok: false, error: 'Inquiry not found.' };

  const next = nextStage(inquiry.status as InquiryStatus);
  if (!next) return { ok: false, error: 'This inquiry cannot be advanced further.' };

  await db.inquiry.update({
    where: { id: inquiryId },
    data: { status: next, contactedAt: next === 'CONTACTED' ? new Date() : inquiry.contactedAt },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'inquiry.advanced',
    entityType: 'Inquiry',
    entityId: inquiryId,
    metadata: { from: inquiry.status, to: next },
  });

  // "Approved" = the request is confirmed for enrollment.
  if (next === 'CONFIRMED') {
    const to = inquiry.student?.email ?? inquiry.guestEmail;
    if (to) {
      await sendInquiryApprovedEmail({
        to,
        name: inquiry.student?.name ?? inquiry.guestName ?? 'there',
        courseTitle: inquiry.course.title,
      });
    }
  }

  revalidatePath('/admin/inquiries');
  return { ok: true };
}

/** Decline an open inquiry (terminal). */
export async function declineInquiry(inquiryId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const inquiry = await db.inquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry) return { ok: false, error: 'Inquiry not found.' };
  if (!isOpen(inquiry.status as InquiryStatus)) {
    return { ok: false, error: 'This inquiry is already closed.' };
  }

  await db.inquiry.update({ where: { id: inquiryId }, data: { status: 'DECLINED' } });
  await recordAudit({
    actorId: session.user.id,
    action: 'inquiry.declined',
    entityType: 'Inquiry',
    entityId: inquiryId,
  });

  revalidatePath('/admin/inquiries');
  return { ok: true };
}

/** Random, high-entropy password for invited accounts — the user sets their own via email. */
function generateInvitePassword(): string {
  return `${randomBytes(24).toString('base64url')}Aa1!`;
}

interface ResolveStudentResult {
  studentId?: string;
  invitedEmail?: string;
  error?: string;
}

/**
 * Ensure an inquiry has a student account behind it. Registered inquiries already
 * do; guest inquiries link to an existing account by email, or create a new
 * STUDENT account (invited to set a password). Backfills inquiry.studentId.
 */
async function resolveInquiryStudent(inquiry: {
  id: string;
  studentId: string | null;
  guestName: string | null;
  guestEmail: string | null;
}): Promise<ResolveStudentResult> {
  if (inquiry.studentId) return { studentId: inquiry.studentId };

  const email = inquiry.guestEmail?.trim().toLowerCase();
  if (!email) return { error: 'This inquiry has no contact email to enroll.' };

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    await db.inquiry.update({ where: { id: inquiry.id }, data: { studentId: existing.id } });
    return { studentId: existing.id };
  }

  try {
    const created = await auth.api.signUpEmail({
      body: {
        name: inquiry.guestName?.trim() || email,
        email,
        password: generateInvitePassword(),
      },
    });
    await db.user.update({
      where: { id: created.user.id },
      data: { role: ROLES.STUDENT, emailVerified: true },
    });
    await db.inquiry.update({ where: { id: inquiry.id }, data: { studentId: created.user.id } });
    return { studentId: created.user.id, invitedEmail: email };
  } catch (error) {
    if (error instanceof APIError) return { error: error.message };
    return { error: 'Could not create the student account.' };
  }
}

/** Resolve the cohort side of the XOR for a given mode, or an error string. */
function resolveCohort(
  mode: EnrollmentMode,
  batchId: string | null,
  learningPlanId: string | null
): { batchId: string | null; learningPlanId: string | null } | string {
  if (mode === 'GROUP_LIVE') {
    if (!batchId) return 'Group (live) enrollments must be assigned to a batch.';
    return { batchId, learningPlanId: null };
  }
  if (!learningPlanId) return 'Self-paced enrollments must be assigned to a learning plan.';
  return { batchId: null, learningPlanId };
}

/**
 * Convert a confirmed inquiry into an enrollment. Assigns the cohort matching the
 * inquiry's mode (batch for GROUP_LIVE, learning plan for SELF_PACED — the DB
 * enforces exactly one), links the inquiry, and marks it ENROLLED.
 */
export async function convertInquiryToEnrollment(
  input: ConvertInquiryInput
): Promise<EnrollmentResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = convertInquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid input.' };
  const { inquiryId, batchId, learningPlanId } = parsed.data;

  const inquiry = await db.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      enrollment: { select: { id: true } },
      course: { select: { title: true } },
    },
  });
  if (!inquiry) return { ok: false, error: 'Inquiry not found.' };
  if (inquiry.enrollment) return { ok: false, error: 'This inquiry is already enrolled.' };
  if (!isOpen(inquiry.status as InquiryStatus)) {
    return { ok: false, error: 'This inquiry is closed.' };
  }

  const cohort = resolveCohort(inquiry.mode as EnrollmentMode, batchId, learningPlanId);
  if (typeof cohort === 'string') return { ok: false, error: cohort };

  // Validate the chosen cohort belongs to this course, capturing its name.
  let cohortLabel = 'your cohort';
  if (cohort.batchId) {
    const batch = await db.batch.findFirst({
      where: { id: cohort.batchId, courseId: inquiry.courseId },
      select: { id: true, name: true },
    });
    if (!batch) return { ok: false, error: 'That batch does not belong to this course.' };
    cohortLabel = `batch "${batch.name}"`;
  }
  if (cohort.learningPlanId) {
    const plan = await db.learningPlan.findFirst({
      where: { id: cohort.learningPlanId, courseId: inquiry.courseId },
      select: { id: true, name: true },
    });
    if (!plan) return { ok: false, error: 'That learning plan does not belong to this course.' };
    cohortLabel = `the "${plan.name}" learning plan`;
  }

  const resolved = await resolveInquiryStudent(inquiry);
  if (resolved.error || !resolved.studentId) {
    return { ok: false, error: resolved.error ?? 'Could not resolve the student account.' };
  }
  const studentId = resolved.studentId;

  const existing = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: inquiry.courseId } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: 'This student is already enrolled in the course.' };

  const enrollment = await db.$transaction(async (tx) => {
    const created = await tx.enrollment.create({
      data: {
        studentId,
        courseId: inquiry.courseId,
        mode: inquiry.mode,
        inquiryId: inquiry.id,
        batchId: cohort.batchId,
        learningPlanId: cohort.learningPlanId,
      },
    });
    await tx.inquiry.update({ where: { id: inquiry.id }, data: { status: 'ENROLLED' } });
    return created;
  });

  // A freshly-created guest account gets a "set your password" invite (non-fatal).
  if (resolved.invitedEmail) {
    try {
      await auth.api.requestPasswordReset({
        body: { email: resolved.invitedEmail, redirectTo: '/reset-password' },
      });
    } catch (error) {
      console.error('invite email failed', error);
    }
  }

  // Enrollment confirmation + cohort assignment email.
  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { email: true, name: true },
  });
  if (student?.email) {
    await sendEnrolledEmail({
      to: student.email,
      name: student.name,
      courseTitle: inquiry.course.title,
      cohortLabel,
      invited: Boolean(resolved.invitedEmail),
    });
  }

  await recordAudit({
    actorId: session.user.id,
    action: 'enrollment.created',
    entityType: 'Enrollment',
    entityId: enrollment.id,
    metadata: {
      from: 'inquiry',
      inquiryId: inquiry.id,
      mode: inquiry.mode,
      invited: Boolean(resolved.invitedEmail),
    },
  });

  if (cohort.batchId) void syncBatchMeetAttendees(cohort.batchId);

  revalidatePath('/admin/inquiries');
  revalidateEnrollment(enrollment.id);
  return { ok: true, enrollmentId: enrollment.id };
}

/** Create an enrollment directly, bypassing the inquiry pipeline (admin super-user). */
export async function createEnrollment(input: CreateEnrollmentInput): Promise<EnrollmentResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createEnrollmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { studentId, courseId, mode, batchId, learningPlanId } = parsed.data;

  const cohort = resolveCohort(mode, batchId, learningPlanId);
  if (typeof cohort === 'string') return { ok: false, error: cohort };

  const [student, course] = await Promise.all([
    db.user.findUnique({ where: { id: studentId }, select: { id: true, email: true, name: true } }),
    db.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } }),
  ]);
  if (!student) return { ok: false, error: 'Student not found.' };
  if (!course) return { ok: false, error: 'Course not found.' };

  let cohortLabel = 'your cohort';
  if (cohort.batchId) {
    const batch = await db.batch.findFirst({
      where: { id: cohort.batchId, courseId },
      select: { id: true, name: true },
    });
    if (!batch) return { ok: false, error: 'That batch does not belong to this course.' };
    cohortLabel = `batch "${batch.name}"`;
  }
  if (cohort.learningPlanId) {
    const plan = await db.learningPlan.findFirst({
      where: { id: cohort.learningPlanId, courseId },
      select: { id: true, name: true },
    });
    if (!plan) return { ok: false, error: 'That learning plan does not belong to this course.' };
    cohortLabel = `the "${plan.name}" learning plan`;
  }

  const existing = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: 'This student is already enrolled in the course.' };

  const enrollment = await db.enrollment.create({
    data: {
      studentId,
      courseId,
      mode,
      batchId: cohort.batchId,
      learningPlanId: cohort.learningPlanId,
    },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'enrollment.created',
    entityType: 'Enrollment',
    entityId: enrollment.id,
    metadata: { from: 'direct', mode },
  });

  if (cohort.batchId) void syncBatchMeetAttendees(cohort.batchId);

  if (student.email) {
    await sendEnrolledEmail({
      to: student.email,
      name: student.name,
      courseTitle: course.title,
      cohortLabel,
      invited: false,
    });
  }

  revalidateEnrollment(enrollment.id);
  return { ok: true, enrollmentId: enrollment.id };
}

/** Remove an enrollment (cascades its payments + progress). */
export async function removeEnrollment(enrollmentId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, studentId: true, courseId: true },
  });
  if (!enrollment) return { ok: false, error: 'Enrollment not found.' };

  await db.enrollment.delete({ where: { id: enrollmentId } });
  await recordAudit({
    actorId: session.user.id,
    action: 'enrollment.removed',
    entityType: 'Enrollment',
    entityId: enrollmentId,
    metadata: { studentId: enrollment.studentId, courseId: enrollment.courseId },
  });

  revalidateEnrollment();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

/** Record a manual payment against an enrollment. */
export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid payment.' };
  }
  const data = parsed.data;

  const enrollment = await db.enrollment.findUnique({
    where: { id: data.enrollmentId },
    select: { id: true },
  });
  if (!enrollment) return { ok: false, error: 'Enrollment not found.' };

  const payment = await db.payment.create({
    data: {
      enrollmentId: data.enrollmentId,
      amountCents: Math.round(data.amount * 100),
      currency: data.currency,
      status: data.status,
      method: data.method || null,
      reference: data.reference || null,
      note: data.note || null,
      paidAt: data.status === 'PAID' || data.status === 'PARTIAL' ? new Date() : null,
      recordedById: session.user.id,
    },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'payment.recorded',
    entityType: 'Payment',
    entityId: payment.id,
    metadata: { enrollmentId: data.enrollmentId, amountCents: payment.amountCents, status: data.status },
  });

  revalidateEnrollment(data.enrollmentId);
  return { ok: true };
}

/** Delete a recorded payment (correcting a mistake). */
export async function deletePayment(paymentId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, enrollmentId: true, amountCents: true },
  });
  if (!payment) return { ok: false, error: 'Payment not found.' };

  await db.payment.delete({ where: { id: paymentId } });
  await recordAudit({
    actorId: session.user.id,
    action: 'payment.deleted',
    entityType: 'Payment',
    entityId: paymentId,
    metadata: { enrollmentId: payment.enrollmentId, amountCents: payment.amountCents },
  });

  revalidateEnrollment(payment.enrollmentId);
  return { ok: true };
}
