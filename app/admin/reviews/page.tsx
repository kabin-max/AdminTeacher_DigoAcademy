import { Star } from 'lucide-react';

import { ReviewsTable, type ReviewRow } from '@/features/reviews/components/ReviewsTable';
import { getAllReviews } from '@/features/reviews/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminReviewsPage() {
  await requireRole(ROLES.ADMIN);
  const reviews = await getAllReviews();

  const rows: ReviewRow[] = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt.toISOString(),
    studentName: r.student.name,
    courseId: r.course.id,
    courseTitle: r.course.title,
    instructorName: r.course.instructor.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<Star />}
        title="Reviews"
        description={`${reviews.length} review${reviews.length === 1 ? '' : 's'}. Remove inappropriate content — ratings recompute automatically.`}
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <ReviewsTable reviews={rows} />
      )}
    </div>
  );
}
