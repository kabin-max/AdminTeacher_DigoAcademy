import { CourseDetailsForm } from '@/features/courses/components/CourseDetailsForm';
import { getCategoryChoices } from '@/features/categories/server/data';
import { requireRole } from '@/lib/auth/session';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { ROLES } from '@/shared/constants/roles';

export default async function NewCoursePage() {
  await requireRole(ROLES.INSTRUCTOR);
  const categories = await getCategoryChoices();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New course</h1>
      <Card>
        <CardHeader>
          <CardTitle>Course details</CardTitle>
          <CardDescription>You can add sections and lessons after creating it.</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseDetailsForm categories={categories} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
