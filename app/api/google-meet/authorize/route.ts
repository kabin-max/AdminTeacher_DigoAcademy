import { randomUUID } from 'node:crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/session';
import { getMeetAuthUrl, isMeetConfigured } from '@/lib/meet';
import { ROLES } from '@/shared/constants/roles';

const STATE_COOKIE = 'google_meet_oauth_state';

/** Kicks off the one-time "connect Google Calendar" flow (admin only). */
export async function GET(request: Request) {
  await requireRole(ROLES.ADMIN);
  if (!isMeetConfigured) {
    return NextResponse.redirect(new URL('/admin/settings?meet=not_configured', request.url));
  }

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return NextResponse.redirect(getMeetAuthUrl(state));
}
