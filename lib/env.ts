import 'server-only';

import { z } from 'zod';

/**
 * Server-side environment validation. Import only from server code.
 * Add new server env vars here so misconfiguration fails fast at boot.
 *
 * On Vercel/CI these must be set in Project → Settings → Environment Variables
 * (Production + Preview). Missing DATABASE_URL or BETTER_AUTH_SECRET will fail
 * the build when /api/auth is collected.
 */
const envSchema = z.object({
  /**
   * App / Prisma Client connection. With Supabase, use the session or transaction
   * pooler (`*.pooler.supabase.com`) — not the IPv6-only `db.*` host.
   */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /**
   * Direct Postgres URL for Prisma CLI migrations. Required when DATABASE_URL
   * points at a pooler (Supabase). Optional for local Docker — CLI falls back
   * to DATABASE_URL in prisma.config.ts.
   */
  DIRECT_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  /** Public app origin, e.g. https://your-app.vercel.app — required in production. */
  BETTER_AUTH_URL: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().url().default('http://localhost:3000')
  ),

  // Google OAuth (optional — social login is enabled only when both are set)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Google Meet integration: a separate OAuth client (Calendar API scope) used to
  // create Meet-enabled Calendar events server-side, distinct from the login
  // credentials above. One shared Google account connects once in /admin/settings.
  GOOGLE_MEET_CLIENT_ID: z.string().optional(),
  GOOGLE_MEET_CLIENT_SECRET: z.string().optional(),

  // Transactional email via AWS SES. When SES_REGION is set, email sends for
  // real via SES; otherwise dev logs to the console and prod throws (fail loud).
  SES_REGION: z.string().optional(),
  /** Explicit SES credentials; omit to use the default AWS provider chain (IAM role, env). */
  SES_ACCESS_KEY_ID: z.string().optional(),
  SES_SECRET_ACCESS_KEY: z.string().optional(),
  /** Verified SES sender identity, e.g. "Digo Academy <no-reply@digo.academy>". */
  EMAIL_FROM: z.string().default('Digo Academy <no-reply@digo.academy>'),

  // Mandatory MFA for instructors/admins. On by default; set to "false" to relax
  // it in local development. Any value other than "false" keeps it enforced.
  ENFORCE_MFA: z.string().optional(),

  // S3 / object storage (MinIO for local dev, AWS S3 / Supabase Storage in prod).
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** Custom endpoint for S3-compatible storage (e.g. http://localhost:9000 for MinIO). */
  S3_ENDPOINT: z.string().optional(),
  /** Path-style addressing — required by MinIO ("true"). */
  S3_FORCE_PATH_STYLE: z.string().optional(),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (result.success) return result.data;

  const details = result.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment variables:\n${details}\n\n` +
      'Set DATABASE_URL and BETTER_AUTH_SECRET (and BETTER_AUTH_URL for production) ' +
      'in your host’s environment settings, then redeploy.'
  );
}

export const env = parseEnv();

/** Google social login is available only when both credentials are configured. */
export const isGoogleAuthEnabled =
  !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;

/** Google Meet integration is available once its OAuth client is configured. */
export const isMeetConfigured =
  !!env.GOOGLE_MEET_CLIENT_ID && !!env.GOOGLE_MEET_CLIENT_SECRET;

/** Uploads are available only when a bucket + credentials are configured. */
export const isS3Configured =
  !!env.S3_BUCKET && !!env.S3_ACCESS_KEY_ID && !!env.S3_SECRET_ACCESS_KEY;

/**
 * Whether instructors/admins are forced to enrol MFA before using their dashboard.
 * Enforced unless explicitly disabled (`ENFORCE_MFA=false`), so production stays
 * strict by default and only local dev can opt out.
 */
export const isMfaEnforced = env.ENFORCE_MFA !== 'false';
