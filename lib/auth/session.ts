import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { auth } from '@/lib/auth';
import { isMfaEnforced } from '@/lib/env';
import { MFA_REQUIRED_ROLES, ROLE_HOME, type Role } from '@/shared/constants/roles';

/** Path where a user sets up their second factor. */
export const MFA_SETUP_PATH = '/settings/security?setup=required';

/** Read the current session (or null) from request headers. Memoized per request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Require an authenticated, non-suspended user. Redirects to /login when there is
 * no session, and to /suspended when the account has been suspended.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect('/login');
  if ((session.user.status as string) === 'SUSPENDED') redirect('/suspended');
  return session;
}

/**
 * Non-redirecting authorization check for Server Actions / Route Handlers, which
 * re-verify auth independently (they're reachable by direct POST). Returns the
 * session when the caller is authenticated, active, and holds one of `roles`;
 * otherwise `null` so the caller can return an error result.
 */
export async function authorize(...roles: Role[]) {
  const session = await getSession();
  if (!session) return null;
  if ((session.user.status as string) === 'SUSPENDED') return null;
  if (!roles.includes(session.user.role as Role)) return null;
  return session;
}

/**
 * Require one of the given roles. Redirects an authenticated user who lacks the
 * role to their own dashboard, so users never see another role's area.
 */
export async function requireRole(...roles: Role[]) {
  const session = await requireUser();
  const role = session.user.role as Role;
  if (!roles.includes(role)) redirect(ROLE_HOME[role] ?? '/login');

  // MFA is mandatory for instructors/admins ("default-on"). Send them to set it
  // up before they can use their dashboard. Can be relaxed in dev via ENFORCE_MFA.
  if (isMfaEnforced && MFA_REQUIRED_ROLES.includes(role) && !session.user.twoFactorEnabled) {
    redirect(MFA_SETUP_PATH);
  }
  return session;
}
