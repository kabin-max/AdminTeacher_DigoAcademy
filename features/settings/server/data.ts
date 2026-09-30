import 'server-only';

import { SETTINGS, SETTINGS_BY_KEY, type SettingValue } from '@/features/settings/registry';
import { db } from '@/lib/db';

/**
 * Current value of every known setting, merging stored rows over the registry
 * defaults so newly-added settings surface immediately with their default.
 */
export async function getSettings(): Promise<Record<string, SettingValue>> {
  const rows = await db.platformSetting.findMany({
    where: { key: { in: SETTINGS.map((s) => s.key) } },
  });
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  const result: Record<string, SettingValue> = {};
  for (const def of SETTINGS) {
    const raw = stored.get(def.key);
    result[def.key] =
      raw === undefined || raw === null ? def.default : (raw as SettingValue);
  }
  return result;
}

/** Read a single setting value (falling back to its registry default). */
export async function getSetting(key: string): Promise<SettingValue | undefined> {
  const def = SETTINGS_BY_KEY[key];
  if (!def) return undefined;
  const row = await db.platformSetting.findUnique({ where: { key } });
  return row ? (row.value as SettingValue) : def.default;
}
