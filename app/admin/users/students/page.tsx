import { Users } from 'lucide-react';

import { UsersView } from '@/features/users/components/UsersView';
import { ROLES } from '@/shared/constants/roles';

export default function AdminStudentsPage() {
  return (
    <UsersView
      role={ROLES.STUDENT}
      title="Students"
      subtitle="Learners enrolled across batches and learning plans."
      icon={<Users />}
    />
  );
}
