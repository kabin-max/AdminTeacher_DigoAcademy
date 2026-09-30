import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { recordAudit } from '@/lib/audit';
import { requireRole } from '@/lib/auth/session';
import { exchangeMeetCode } from '@/lib/meet';
import { ROLES } from '@/shared/constants/roles';

const STATE_COOKIE = 'google_meet_oauth_state';

/** Google redirects here after the admin grants Calendar access. */
export async function GET(request: Request) {
  const session = await requireRole(ROLES.ADMIN);

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/admin/settings?meet=error', request.url));
  }

  try {
    const { accountEmail } = await exchangeMeetCode(code);
    await recordAudit({
      actorId: session.user.id,
      action: 'googleMeet.connected',
      entityType: 'GoogleMeetConnection',
      metadata: { accountEmail },
    });
    return NextResponse.redirect(new URL('/admin/settings?meet=connected', request.url));
  } catch (error) {
    console.error('google-meet: connect failed', error);
    return NextResponse.redirect(new URL('/admin/settings?meet=error', request.url));
  }
}
