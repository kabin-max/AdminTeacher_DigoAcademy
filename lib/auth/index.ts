import 'server-only';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor } from 'better-auth/plugins';

import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { renderEmail } from '@/lib/email-template';
import { env, isGoogleAuthEnabled } from '@/lib/env';
import { lockoutAfterHook, lockoutBeforeHook } from '@/lib/auth/lockout';

/**
 * Better Auth server instance — the single source of truth for auth.
 *
 * Server-only. The matching Prisma models (User/Session/Account/Verification/
 * TwoFactor) live in prisma/schema.prisma; `role` and `status` are exposed to the
 * session via `user.additionalFields` (input:false so they can't be set by clients
 * — role elevation happens server-side only, e.g. instructor registration).
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: ['http://localhost:3001', 'https://portal.digoacademy.com', 'https://main.d11t2mwdjhbzy4.amplifyapp.com', 'https://instructor.digo.academy'],
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const { html, text } = renderEmail({
        heading: 'Reset your password',
        intro: `Hi ${user.name || 'there'},`,
        paragraphs: ['We received a request to reset your Digo Academy password. Click below to choose a new one.'],
        button: { label: 'Reset password', url },
        footerNote: "This link expires soon. If you didn't request it, you can safely ignore this email.",
      });
      await sendEmail({ to: user.email, subject: 'Reset your Digo Academy password', text, html });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { html, text } = renderEmail({
        heading: 'Verify your email',
        intro: `Hi ${user.name || 'there'},`,
        paragraphs: ['Welcome to Digo Academy! Confirm your email address to activate your account.'],
        button: { label: 'Verify email', url },
        footerNote: 'This link expires soon.',
      });
      await sendEmail({ to: user.email, subject: 'Verify your Digo Academy email', text, html });
    },
  },

  socialProviders: isGoogleAuthEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        input: false,
        defaultValue: 'STUDENT',
      },
      status: {
        type: 'string',
        required: false,
        input: false,
        defaultValue: 'ACTIVE',
      },
    },
  },

  // Cooldown/throttling for auth endpoints. Tighter limits on the sensitive routes.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      // Coarse IP flood guard. Per-account lockout (lib/auth/lockout.ts) is the
      // primary defense and trips first at 5 failed passwords, so this sits above
      // it to stay a backstop rather than masking the account lock.
      '/sign-in/email': { window: 60, max: 15 },
      '/request-password-reset': { window: 60, max: 3 },
      '/two-factor/verify-totp': { window: 60, max: 5 },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },

  // Per-account lockout after repeated failed password logins.
  hooks: {
    before: lockoutBeforeHook,
    after: lockoutAfterHook,
  },

  plugins: [
    twoFactor({ issuer: 'Digo Academy' }),
    nextCookies(), // keep last — sets cookies on Next.js responses
  ],
});

export type Auth = typeof auth;
