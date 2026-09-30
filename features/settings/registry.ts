/**
 * Registry of platform settings. Each setting is stored as a row in the
 * `PlatformSetting` table (key + JSON value); this registry defines the known
 * keys, their type, default, and copy so the admin UI and the server validation
 * stay in sync. Framework-free so it can be imported on client and server.
 */
export type SettingValue = string | boolean;

export type SettingDefinition =
  | {
      key: string;
      type: 'boolean';
      label: string;
      description: string;
      default: boolean;
    }
  | {
      key: string;
      type: 'text';
      label: string;
      description: string;
      default: string;
    }
  | {
      key: string;
      type: 'select';
      label: string;
      description: string;
      default: string;
      options: { value: string; label: string }[];
    };

export const SETTINGS: readonly SettingDefinition[] = [
  {
    key: 'platform.name',
    type: 'text',
    label: 'Platform name',
    description: 'Displayed across the app and in emails.',
    default: 'Digo Academy',
  },
  {
    key: 'platform.supportEmail',
    type: 'text',
    label: 'Support email',
    description: 'Where learners are directed for help.',
    default: 'support@digo.academy',
  },
  {
    key: 'courseReview.forceFullReReview',
    type: 'boolean',
    label: 'Force full re-review',
    description:
      'When on, substantive edits to a published course require full re-approval instead of a lightweight re-review flag.',
    default: false,
  },
  {
    key: 'enrollment.defaultMode',
    type: 'select',
    label: 'Default enrollment mode',
    description: 'Preselected mode when creating a new enrollment.',
    default: 'GROUP_LIVE',
    options: [
      { value: 'GROUP_LIVE', label: 'Group (live)' },
      { value: 'SELF_PACED', label: 'Self-paced' },
    ],
  },
] as const;

export const SETTINGS_BY_KEY: Record<string, SettingDefinition> = Object.fromEntries(
  SETTINGS.map((s) => [s.key, s])
);

/** Coerce/validate a raw value against a setting's type; returns null if invalid. */
export function normalizeSettingValue(
  def: SettingDefinition,
  raw: unknown
): SettingValue | null {
  if (def.type === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  }
  if (def.type === 'select') {
    if (typeof raw !== 'string') return null;
    return def.options.some((o) => o.value === raw) ? raw : null;
  }
  // text
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length <= 200 ? trimmed : null;
}
