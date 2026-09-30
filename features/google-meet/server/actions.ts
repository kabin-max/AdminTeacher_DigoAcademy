'use server';

import { revalidatePath } from 'next/cache';

import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { disconnectMeet, getMeetConnection, syncAllBatchesMeetAttendees } from '@/lib/meet';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function disconnectGoogleMeet(): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const connection = await getMeetConnection();
  await disconnectMeet();
  await recordAudit({
    actorId: session.user.id,
    action: 'googleMeet.disconnected',
    entityType: 'GoogleMeetConnection',
    metadata: connection ? { accountEmail: connection.accountEmail } : undefined,
  });

  revalidatePath('/admin/settings');
  return { ok: true };
}

export async function resyncAllGoogleMeetEvents(): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  await syncAllBatchesMeetAttendees();
  revalidatePath('/admin/batches');
  return { ok: true };
}
