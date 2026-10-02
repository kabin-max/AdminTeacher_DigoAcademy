import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';
import { ROLE_HOME, type Role } from '@/shared/constants/roles';

/**
 * Post-login router. Sends each authenticated user to their own role dashboard,
 * so the rest of the app can link to a single neutral `/dashboard`.
 */
export default async function DashboardRouterPage() {
  const session = await requireUser();
  const role = session.user.role as Role;
  redirect(ROLE_HOME[role] ?? '/login');
}
