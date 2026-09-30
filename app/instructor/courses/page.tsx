import Link from 'next/link';

import { CourseStatusBadge } from '@/features/courses/components/CourseStatusBadge';
import { getInstructorCourses } from '@/features/courses/server/data';
import { requireRole } from '@/lib/auth/session';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';

export default async function InstructorCoursesPage() {
  const session = await requireRole(ROLES.INSTRUCTOR);
  const courses = await getInstructorCourses(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Build, submit, and manage your courses.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/instructor/courses/new">New course</Link>} />
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t created any courses yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {courses.map((course) => (
            <li
              key={course.id}
              className="relative flex items-center justify-between gap-4 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-muted/40"
            >
              <div className="min-w-0">
                <Link
                  href={`/instructor/courses/${course.id}`}
                  className="font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
                >
                  {course.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {course.category?.name ?? 'Uncategorized'} · {course._count.sections} sections ·{' '}
                  {course._count.enrollments} enrolled
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
