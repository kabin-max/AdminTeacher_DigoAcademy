import type { ReactNode } from 'react';

import { requireUser } from '@/lib/auth/session';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { NAV_BY_ROLE } from '@/shared/constants/nav';
import type { Role } from '@/shared/constants/roles';

/**
 * Settings has no dashboard of its own — it's reached via the "Security" link
 * at the bottom of every role's sidebar. Render the *same* sidebar the user
 * came from (keyed off their role) instead of a bare "Settings" area: that
 * area had no matching route (`/settings` 404s — only `/settings/security`
 * exists) and no `navGroups`, which also meant `DashboardShell` fell back to
 * the sidebar-less top-bar layout, so the sidebar appeared to "disappear".
 */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();
  const { area, roleLabel, navGroups } = NAV_BY_ROLE[session.user.role as Role];
  return (
    <DashboardShell area={area} userName={session.user.name} roleLabel={roleLabel} navGroups={navGroups}>
      {children}
    </DashboardShell>
  );
}
