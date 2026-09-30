'use server';

import { randomUUID } from 'node:crypto';

import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { isS3Configured } from '@/lib/env';
import { presignUpload } from '@/lib/storage';
import { ROLES } from '@/shared/constants/roles';

const CONTENT_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_BYTES = 2_000_000_000;

export interface PresignResult {
  ok: boolean;
  error?: string;
  url?: string;
  key?: string;
}

const extFromName = (name: string) => {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name);
  return match ? match[1].toLowerCase() : 'bin';
};

/**
 * Presign a batch class-video upload. Re-checked here (direct-POST reachable):
 * admins manage any batch, instructors only a batch they're assigned to.
 */
export async function presignBatchVideoUpload(input: {
  batchId: string;
  filename: string;
  contentType: string;
  size: number;
}): Promise<PresignResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (!isS3Configured) return { ok: false, error: 'File storage is not configured.' };
  if (!CONTENT_TYPES.includes(input.contentType)) {
    return { ok: false, error: "That file type isn't allowed for a class video." };
  }
  if (input.size > MAX_BYTES) return { ok: false, error: 'That file is too large.' };

  const isAdmin = session.user.role === ROLES.ADMIN;
  const batch = await db.batch.findFirst({
    where: isAdmin ? { id: input.batchId } : { id: input.batchId, instructorId: session.user.id },
    select: { id: true },
  });
  if (!batch) return { ok: false, error: 'Batch not found.' };

  const key = `batches/${batch.id}/videos/${randomUUID()}.${extFromName(input.filename)}`;
  const url = await presignUpload(key, input.contentType);
  return { ok: true, url, key };
}
