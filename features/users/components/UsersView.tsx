import type { ReactNode } from 'react';

import { UsersTable, type UserRow } from '@/features/users/components/UsersTable';
import { getAllUsers } from '@/features/users/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES, type Role } from '@/shared/constants/roles';

/**
 * Admin users listing, optionally scoped to a single role. Shared by the
 * "All users", "Instructors", and "Students" routes so they stay in sync.
 */
export async function UsersView({
  role,
  title,
  subtitle,
  icon,
  action,
}: {
  role?: Role;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  /** Optional header action (e.g. an "Add instructor" button). */
  action?: ReactNode;
}) {
  const session = await requireRole(ROLES.ADMIN);
  const users = await getAllUsers(role);

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    status: u.status,
    emailVerified: u.emailVerified,
    twoFactorEnabled: u.twoFactorEnabled,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={icon}
        title={title}
        description={`${users.length} account${users.length === 1 ? '' : 's'}. ${subtitle}`}
        action={action}
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users here yet.</p>
      ) : (
        <UsersTable users={rows} currentUserId={session.user.id} />
      )}
    </div>
  );
}
