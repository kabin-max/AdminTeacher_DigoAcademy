'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { updateSetting } from '@/features/settings/server/actions';
import { SETTINGS, type SettingValue } from '@/features/settings/registry';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50';

export function SettingsForm({ values }: { values: Record<string, SettingValue> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      SETTINGS.filter((s) => s.type === 'text').map((s) => [s.key, String(values[s.key] ?? '')])
    )
  );

  function save(key: string, value: SettingValue, success = 'Setting saved.') {
    startTransition(async () => {
      const result = await updateSetting(key, value);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not save setting.');
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  return (
    <div className="divide-y rounded-lg border">
      {SETTINGS.map((def) => {
        const current = values[def.key];
        return (
          <div
            key={def.key}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
          >
            <div className="min-w-0 max-w-md">
              <p className="text-sm font-medium">{def.label}</p>
              <p className="text-xs text-muted-foreground">{def.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {def.type === 'boolean' && (
                <>
                  <Badge variant={current ? 'secondary' : 'outline'}>
                    {current ? 'On' : 'Off'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => save(def.key, !current, current ? 'Turned off.' : 'Turned on.')}
                  >
                    {current ? 'Turn off' : 'Turn on'}
                  </Button>
                </>
              )}

              {def.type === 'select' && (
                <select
                  className={selectClass}
                  value={String(current)}
                  disabled={isPending}
                  onChange={(e) => save(def.key, e.target.value)}
                  aria-label={def.label}
                >
                  {def.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}

              {def.type === 'text' && (
                <>
                  <Input
                    className="h-9 w-64"
                    value={drafts[def.key] ?? ''}
                    disabled={isPending}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [def.key]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending || drafts[def.key] === String(current)}
                    onClick={() => save(def.key, drafts[def.key] ?? '')}
                  >
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
