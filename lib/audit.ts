import 'server-only';

import { db } from '@/lib/db';

export interface AuditInput {
  actorId: string | null;
  action: string; // e.g. "course.published"
  entityType: string; // e.g. "Course"
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append an immutable audit record. Called from Server Actions whenever an
 * authorized, consequential change happens (lifecycle transitions, suspensions,
 * payments). Never throws into the caller's happy path — audit failures are
 * logged, not surfaced.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ? (input.metadata as object) : undefined,
      },
    });
  } catch (error) {
    console.error('audit write failed', input.action, error);
  }
}
