import type { ReactNode } from 'react';

import { requireRole } from '@/lib/auth/session';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { ADMIN_NAV_GROUPS } from '@/shared/constants/nav';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(ROLES.ADMIN);
  return (
    <DashboardShell
      area="Admin"
      userName={session.user.name}
      roleLabel="Administrator"
      navGroups={ADMIN_NAV_GROUPS}
    >
      {children}
    </DashboardShell>
  );
}
