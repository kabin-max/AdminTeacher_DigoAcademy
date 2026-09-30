import { Map } from 'lucide-react';

import {
  LearningPlanManager,
  type LearningPlanRow,
} from '@/features/cohorts/components/LearningPlanManager';
import { getCourseChoices, getLearningPlans } from '@/features/cohorts/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminLearningPlansPage() {
  await requireRole(ROLES.ADMIN);
  const [plans, courses] = await Promise.all([getLearningPlans(), getCourseChoices()]);

  const rows: LearningPlanRow[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    courseId: p.courseId,
    courseTitle: p.course.title,
    description: p.description,
    enrollmentCount: p._count.enrollments,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<Map />}
        title="Learning plans"
        description="Structured plans for self-paced enrollments (materials-only, no live sessions)."
      />
      <LearningPlanManager plans={rows} courses={courses.map((c) => ({ id: c.id, name: c.title }))} />
    </div>
  );
}
