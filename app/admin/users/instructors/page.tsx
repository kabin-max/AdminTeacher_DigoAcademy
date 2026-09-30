import { Plus, UserCog } from 'lucide-react';
import Link from 'next/link';

import { UsersView } from '@/features/users/components/UsersView';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';

export default function AdminInstructorsPage() {
  return (
    <UsersView
      role={ROLES.INSTRUCTOR}
      title="Instructors"
      subtitle="Instructors can author and manage courses."
      icon={<UserCog />}
      action={
        <Button nativeButton={false} render={<Link href="/admin/users/instructors/new" />}>
          <Plus />
          Add instructor
        </Button>
      }
    />
  );
}
