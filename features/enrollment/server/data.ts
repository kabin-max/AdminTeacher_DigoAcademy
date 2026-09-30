import 'server-only';

import { db } from '@/lib/db';

/**
 * All inquiries for the admin pipeline, newest first. Optionally scoped to a course.
 * Each inquiry carries its course's cohorts so the pipeline can convert inline
 * (batches for GROUP_LIVE, learning plans for SELF_PACED).
 */
export async function getInquiries(courseId?: string) {
  return db.inquiry.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: {
        select: {
          id: true,
          title: true,
          batches: { select: { id: true, name: true }, orderBy: { createdAt: 'desc' } },
          learningPlans: { select: { id: true, name: true }, orderBy: { createdAt: 'desc' } },
        },
      },
      enrollment: { select: { id: true } },
    },
  });
}

export type AdminInquiry = Awaited<ReturnType<typeof getInquiries>>[number];

/** A single inquiry with everything needed to convert it into an enrollment. */
export async function getInquiry(inquiryId: string) {
  return db.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: {
        select: {
          id: true,
          title: true,
          batches: { select: { id: true, name: true }, orderBy: { createdAt: 'desc' } },
          learningPlans: { select: { id: true, name: true }, orderBy: { createdAt: 'desc' } },
        },
      },
      enrollment: { select: { id: true } },
    },
  });
}

/** A student's own inquiries with pipeline status, newest first. */
export async function getStudentInquiries(studentId: string) {
  return db.inquiry.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
      enrollment: { select: { id: true } },
    },
  });
}

export type StudentInquiry = Awaited<ReturnType<typeof getStudentInquiries>>[number];

/** Count of a student's active enrollments — for their dashboard. */
export async function getStudentEnrollmentCount(studentId: string): Promise<number> {
  return db.enrollment.count({ where: { studentId } });
}

/** Count of a student's open (non-terminal) inquiries. */
export async function getStudentOpenInquiryCount(studentId: string): Promise<number> {
  return db.inquiry.count({
    where: { studentId, status: { in: ['NEW', 'CONTACTED', 'CONFIRMED'] } },
  });
}

/** Whether the student is enrolled in / has an open inquiry for a given course. */
export async function getStudentCourseBooking(studentId: string, courseId: string) {
  const [enrollment, openInquiry] = await Promise.all([
    db.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { id: true },
    }),
    db.inquiry.findFirst({
      where: { studentId, courseId, status: { in: ['NEW', 'CONTACTED', 'CONFIRMED'] } },
      select: { id: true, status: true },
    }),
  ]);
  return { enrolled: enrollment !== null, openInquiry };
}

/** Course ids the student has an open (non-terminal) inquiry for. */
export async function getOpenInquiryCourseIds(studentId: string): Promise<Set<string>> {
  const rows = await db.inquiry.findMany({
    where: { studentId, status: { in: ['NEW', 'CONTACTED', 'CONFIRMED'] } },
    select: { courseId: true },
  });
  return new Set(rows.map((r) => r.courseId));
}

/** All enrollments for the admin management list, newest first. */
export async function getEnrollments() {
  return db.enrollment.findMany({
    orderBy: { enrolledAt: 'desc' },
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
      batch: { select: { id: true, name: true } },
      learningPlan: { select: { id: true, name: true } },
      _count: { select: { payments: true } },
    },
  });
}

export type AdminEnrollment = Awaited<ReturnType<typeof getEnrollments>>[number];

/** Full enrollment detail including its payment ledger. */
export async function getEnrollmentDetail(enrollmentId: string) {
  return db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, priceCents: true, currency: true } },
      batch: { select: { id: true, name: true } },
      learningPlan: { select: { id: true, name: true } },
      inquiry: { select: { id: true, status: true } },
      payments: {
        orderBy: { createdAt: 'desc' },
        include: { recordedBy: { select: { name: true } } },
      },
    },
  });
}

export type EnrollmentDetail = NonNullable<Awaited<ReturnType<typeof getEnrollmentDetail>>>;

/** Every recorded payment, newest first, for the admin payments ledger. */
export async function getPayments() {
  return db.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      recordedBy: { select: { name: true } },
      enrollment: {
        select: {
          id: true,
          student: { select: { name: true } },
          course: { select: { title: true } },
        },
      },
    },
  });
}

export type AdminPayment = Awaited<ReturnType<typeof getPayments>>[number];

/** Total collected (PAID + PARTIAL) across all enrollments, in cents. */
export async function getCollectedCents() {
  const result = await db.payment.aggregate({
    _sum: { amountCents: true },
    where: { status: { in: ['PAID', 'PARTIAL'] } },
  });
  return result._sum.amountCents ?? 0;
}
