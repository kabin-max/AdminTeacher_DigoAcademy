import 'server-only';

import { APIError, createAuthMiddleware } from 'better-auth/api';

import { db } from '@/lib/db';

/**
 * Per-account lockout on repeated failed password logins. This complements Better
 * Auth's IP-based rate limiting: after MAX_ATTEMPTS bad passwords for one account,
 * that account is locked for LOCK_MINUTES regardless of source IP.
 *
 * Implemented with sign-in hooks (see api/dispatch): the `before` hook rejects a
 * locked account; the `after` hook inspects `ctx.context.returned` — an APIError
 * means the attempt failed.
 */
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SIGN_IN_PATH = '/sign-in/email';

function emailFromBody(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'email' in body) {
    const email = (body as { email?: unknown }).email;
    return typeof email === 'string' ? email : undefined;
  }
  return undefined;
}

export const lockoutBeforeHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== SIGN_IN_PATH) return;
  const email = emailFromBody(ctx.body);
  if (!email) return;

  const user = await db.user.findUnique({
    where: { email },
    select: { lockedUntil: true },
  });

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    throw new APIError('FORBIDDEN', {
      code: 'ACCOUNT_LOCKED',
      message: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
    });
  }
});

export const lockoutAfterHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== SIGN_IN_PATH) return;
  const email = emailFromBody(ctx.body);
  if (!email) return;

  const returned = ctx.context.returned;
  const failed = returned instanceof APIError;

  // A genuinely blocked account (not a bad password) shouldn't burn attempts.
  if (failed) {
    const code = (returned as APIError).body?.code;
    if (code === 'EMAIL_NOT_VERIFIED' || code === 'ACCOUNT_LOCKED') return;

    const user = await db.user.findUnique({
      where: { email },
      select: { failedLoginAttempts: true },
    });
    if (!user) return;

    const attempts = user.failedLoginAttempts + 1;
    await db.user.update({
      where: { email },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    return;
  }

  // Success — clear any accumulated failures (only writes when needed).
  await db.user.updateMany({
    where: { email, OR: [{ failedLoginAttempts: { gt: 0 } }, { lockedUntil: { not: null } }] },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
});
