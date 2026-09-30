import type { ReactNode } from 'react';

import { requireRole } from '@/lib/auth/session';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { INSTRUCTOR_NAV_GROUPS } from '@/shared/constants/nav';
import { ROLES } from '@/shared/constants/roles';

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(ROLES.INSTRUCTOR);
  return (
    <DashboardShell
      area="Instructor"
      userName={session.user.name}
      roleLabel="Instructor"
      navGroups={INSTRUCTOR_NAV_GROUPS}
    >
      {children}
    </DashboardShell>
  );
}
