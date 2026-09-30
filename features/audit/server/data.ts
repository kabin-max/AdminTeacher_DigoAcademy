import 'server-only';

import { db } from '@/lib/db';

/** Most recent audit records (capped) for the admin activity log. */
export async function getAuditLog(limit = 200) {
  return db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: { select: { name: true, email: true } } },
  });
}

export type AuditRow = Awaited<ReturnType<typeof getAuditLog>>[number];
