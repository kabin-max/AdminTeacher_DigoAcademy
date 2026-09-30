import 'server-only';

import dns from 'node:dns';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '@/lib/generated/prisma/client';
import { env } from '@/lib/env';

dns.setDefaultResultOrder('ipv4first');

/**
 * Single PrismaClient instance, reused across HMR (dev) and warm serverless
 * isolates (prod) to avoid opening a new pool per import.
 *
 * Supabase free/session pooler caps ~15 clients. Use the *transaction* pooler
 * for DATABASE_URL (port 6543 + `?pgbouncer=true`) and keep this pool tiny.
 * Migrations still use DIRECT_URL (session/direct) via prisma.config.ts.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function createPrismaClient() {
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: env.DATABASE_URL,
      // In development, Next.js renders layouts and pages concurrently.
      // max: 1 causes pool starvation/deadlock when layout and page both call getSession().
      max: process.env.NODE_ENV === 'production' ? 5 : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = db;
