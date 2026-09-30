import { getSession } from '@/lib/auth/session';
import { HeaderBar } from '@/shared/components/public/HeaderBar';
import { ROLE_HOME, type Role } from '@/shared/constants/roles';

/**
 * Public marketing/catalog header. Auth-aware: signed-in visitors get a link to
 * their dashboard; guests get sign-in / get-started actions. Scroll chrome and
 * the mobile nav drawer live in the client `HeaderBar` shell below it.
 */
export async function PublicHeader() {
  const session = await getSession();
  const home = session ? (ROLE_HOME[session.user.role as Role] ?? '/dashboard') : null;

  return <HeaderBar home={home} />;
}
