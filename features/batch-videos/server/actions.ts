'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const isAdminSession = (session: { user: { role?: string | null } }) =>
  session.user.role === ROLES.ADMIN;

/** A batch the caller may manage videos for: any batch for admins, only their
 * own assigned batch for instructors. */
async function manageableBatch(batchId: string, session: { user: { id: string; role?: string | null } }) {
  return db.batch.findFirst({
    where: isAdminSession(session) ? { id: batchId } : { id: batchId, instructorId: session.user.id },
    select: { id: true },
  });
}

const createBatchVideoSchema = z.object({
  batchId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required.').max(160, 'Title is too long.'),
  videoKey: z.string().min(1, 'Upload a video first.'),
});

export async function createBatchVideo(input: {
  batchId: string;
  title: string;
  videoKey: string;
}): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createBatchVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { batchId, title, videoKey } = parsed.data;

  if (!(await manageableBatch(batchId, session))) return { ok: false, error: 'Batch not found.' };

  const video = await db.batchVideo.create({ data: { batchId, title, videoKey } });
  await recordAudit({
    actorId: session.user.id,
    action: 'batchVideo.created',
    entityType: 'BatchVideo',
    entityId: video.id,
    metadata: { batchId, title },
  });

  revalidatePath(`/admin/batches/${batchId}`);
  revalidatePath(`/instructor/batches/${batchId}`);
  return { ok: true };
}

export async function deleteBatchVideo(id: string): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const video = await db.batchVideo.findUnique({ where: { id } });
  if (!video) return { ok: false, error: 'Video not found.' };
  if (!(await manageableBatch(video.batchId, session))) return { ok: false, error: 'Video not found.' };

  await db.batchVideo.delete({ where: { id } });
  await recordAudit({
    actorId: session.user.id,
    action: 'batchVideo.deleted',
    entityType: 'BatchVideo',
    entityId: id,
    metadata: { title: video.title },
  });

  revalidatePath(`/admin/batches/${video.batchId}`);
  revalidatePath(`/instructor/batches/${video.batchId}`);
  return { ok: true };
}
