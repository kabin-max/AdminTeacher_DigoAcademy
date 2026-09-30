'use server';

import { revalidatePath } from 'next/cache';

import {
  recomputeCourseRating,
  recomputeInstructorRating,
} from '@/features/reviews/server/ratings';
import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Remove an inappropriate review and refresh the affected rating aggregates. */
export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: { course: { select: { id: true, instructorId: true } } },
  });
  if (!review) return { ok: false, error: 'Review not found.' };

  await db.review.delete({ where: { id: reviewId } });
  await Promise.all([
    recomputeCourseRating(review.course.id),
    recomputeInstructorRating(review.course.instructorId),
  ]);
  await recordAudit({
    actorId: session.user.id,
    action: 'review.deleted',
    entityType: 'Review',
    entityId: reviewId,
    metadata: { courseId: review.course.id, rating: review.rating },
  });

  revalidatePath('/admin/reviews');
  return { ok: true };
}
