import { CreateInstructorForm } from '@/features/users/components/CreateInstructorForm';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Panel } from '@/shared/components/dashboard/Panel';
import { ROLES } from '@/shared/constants/roles';

export default async function NewInstructorPage() {
  await requireRole(ROLES.ADMIN);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Instructors', href: '/admin/users/instructors' },
        ]}
        title="Add instructor"
        description="Create an instructor account. They can author and manage courses once signed in."
      />

      <Panel>
        <CreateInstructorForm />
      </Panel>
    </div>
  );
}
