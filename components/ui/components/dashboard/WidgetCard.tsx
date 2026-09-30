import type { ReactNode } from 'react';

import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';

export type WidgetAccent = 'blue' | 'coral' | 'emerald' | 'violet' | 'amber' | 'slate';

const ACCENT_CLASSES: Record<WidgetAccent, string> = {
  blue: 'bg-brand-blue/10 text-brand-blue',
  coral: 'bg-brand-coral/10 text-brand-coral',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
  slate: 'bg-muted text-muted-foreground',
};

export interface WidgetCardProps {
  title: string;
  /** Primary metric. Omit for a pure empty-state widget. */
  value?: ReactNode;
  /** Supporting text or empty-state hint. */
  hint?: string;
  /** Optional leading icon (e.g. a lucide icon element). */
  icon?: ReactNode;
  /** Icon tile accent color. */
  accent?: WidgetAccent;
}

/**
 * Compact dashboard stat card: a colored icon tile, a large metric, and a hint.
 * Metrics fill in as later phases land their data.
 */
export function WidgetCard({ title, value, hint, icon, accent = 'blue' }: WidgetCardProps) {
  return (
    <Card className="gap-0 rounded-2xl border border-border/70 p-5 shadow-sm ring-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && (
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
              ACCENT_CLASSES[accent]
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {value !== undefined && (
        <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      )}
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </Card>
  );
}
