import 'server-only';

import { db } from '@/lib/db';

/** Recompute and cache a course's average rating from its current reviews. */
export async function recomputeCourseRating(courseId: string): Promise<void> {
  const agg = await db.review.aggregate({ where: { courseId }, _avg: { rating: true } });
  await db.course.update({
    where: { id: courseId },
    data: { ratingAvg: agg._avg.rating ?? 0 },
  });
}

/**
 * Recompute an instructor's average rating — the mean of every review across all
 * courses they author — and cache it on their profile (if one exists).
 */
export async function recomputeInstructorRating(instructorId: string): Promise<void> {
  const agg = await db.review.aggregate({
    where: { course: { instructorId } },
    _avg: { rating: true },
  });
  await db.instructorProfile.updateMany({
    where: { userId: instructorId },
    data: { ratingAvg: agg._avg.rating ?? 0 },
  });
}
