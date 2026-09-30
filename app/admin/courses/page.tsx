import { BookOpen, FileUp } from 'lucide-react';
import Link from 'next/link';

import { CourseStatusBadge } from '@/features/courses/components/CourseStatusBadge';
import { getAllCoursesForAdmin } from '@/features/courses/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminCoursesPage() {
  await requireRole(ROLES.ADMIN);
  const courses = await getAllCoursesForAdmin();
  const needsReview = courses.filter((c) => c.status === 'SUBMITTED' || c.reReviewFlagged).length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<BookOpen />}
        title="Courses"
        description={`Manage every course. ${needsReview > 0 ? `${needsReview} awaiting review.` : 'Nothing awaiting review.'}`}
        action={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link href="/admin/courses/import">
                  <FileUp />
                  Import from doc
                </Link>
              }
            />
            <Button nativeButton={false} render={<Link href="/admin/courses/new">New course</Link>} />
          </>
        }
      />

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses yet.</p>
      ) : (
        <ul className="divide-y rounded-2xl bg-card shadow-sm">
          {courses.map((course) => (
            <li
              key={course.id}
              className="relative flex items-center justify-between gap-4 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted/30"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
                >
                  {course.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {course.instructor.name} · {course.category?.name ?? 'Uncategorized'} ·{' '}
                  {course._count.sections} sections · {course._count.enrollments} enrolled
                </p>
              </div>
              <CourseStatusBadge status={course.status} reReviewFlagged={course.reReviewFlagged} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
