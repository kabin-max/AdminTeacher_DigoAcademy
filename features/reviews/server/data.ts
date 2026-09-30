import 'server-only';

import { db } from '@/lib/db';

/** All course reviews for admin moderation, newest first. */
export async function getAllReviews() {
  return db.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { id: true, name: true } },
      course: {
        select: { id: true, title: true, instructor: { select: { id: true, name: true } } },
      },
    },
  });
}

export type AdminReview = Awaited<ReturnType<typeof getAllReviews>>[number];
