import { Users } from 'lucide-react';

import { BatchManager, type BatchRow } from '@/features/cohorts/components/BatchManager';
import {
  getBatches,
  getCourseChoices,
  getInstructorChoices,
} from '@/features/cohorts/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminBatchesPage() {
  await requireRole(ROLES.ADMIN);
  const [batches, courses, instructors] = await Promise.all([
    getBatches(),
    getCourseChoices(),
    getInstructorChoices(),
  ]);

  const rows: BatchRow[] = batches.map((b) => ({
    id: b.id,
    name: b.name,
    courseId: b.courseId,
    courseTitle: b.course.title,
    instructorId: b.instructorId,
    instructorName: b.instructor?.name ?? null,
    startDate: b.startDate?.toISOString() ?? null,
    endDate: b.endDate?.toISOString() ?? null,
    capacity: b.capacity,
    meetLink: b.meetLink,
    enrollmentCount: b._count.enrollments,
    liveClassCount: b._count.liveClasses,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<Users />}
        title="Batches"
        description="Group-class cohorts for live (group) enrollments. Assign an instructor and schedule."
      />
      <BatchManager
        batches={rows}
        courses={courses.map((c) => ({ id: c.id, name: c.title }))}
        instructors={instructors}
      />
    </div>
  );
}
