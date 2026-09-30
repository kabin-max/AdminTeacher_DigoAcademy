import { CourseDetailsForm } from '@/features/courses/components/CourseDetailsForm';
import { getCategoryChoices } from '@/features/categories/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminNewCoursePage() {
  await requireRole(ROLES.ADMIN);
  const categories = await getCategoryChoices();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Courses', href: '/admin/courses' },
        ]}
        title="New course"
      />
      <Card>
        <CardHeader>
          <CardTitle>Course details</CardTitle>
          <CardDescription>
            You own this course and can publish it directly. Add sections and lessons after creating it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseDetailsForm categories={categories} mode="create" builderBasePath="/admin/courses" />
        </CardContent>
      </Card>
    </div>
  );
}
