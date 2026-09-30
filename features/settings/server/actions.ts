'use server';

import { revalidatePath } from 'next/cache';

import { SETTINGS_BY_KEY, normalizeSettingValue } from '@/features/settings/registry';
import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Update a single known platform setting (upsert into PlatformSetting). */
export async function updateSetting(key: string, rawValue: unknown): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const def = SETTINGS_BY_KEY[key];
  if (!def) return { ok: false, error: 'Unknown setting.' };

  const value = normalizeSettingValue(def, rawValue);
  if (value === null) return { ok: false, error: 'Invalid value for this setting.' };

  await db.platformSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'setting.updated',
    entityType: 'PlatformSetting',
    entityId: key,
    metadata: { value },
  });

  revalidatePath('/admin/settings');
  return { ok: true };
}
