import 'server-only';

import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

/** Headline counts for the admin dashboard widgets. */
export async function getAdminOverview() {
  const [
    instructors,
    students,
    openInquiries,
    coursesToReview,
    enrollments,
    collected,
  ] = await Promise.all([
    db.user.count({ where: { role: ROLES.INSTRUCTOR } }),
    db.user.count({ where: { role: ROLES.STUDENT } }),
    db.inquiry.count({ where: { status: { in: ['NEW', 'CONTACTED', 'CONFIRMED'] } } }),
    db.course.count({ where: { OR: [{ status: 'SUBMITTED' }, { reReviewFlagged: true }] } }),
    db.enrollment.count(),
    db.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: { in: ['PAID', 'PARTIAL'] } },
    }),
  ]);

  return {
    instructors,
    students,
    openInquiries,
    coursesToReview,
    enrollments,
    collectedCents: collected._sum.amountCents ?? 0,
  };
}
