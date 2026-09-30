import type { ReactNode } from 'react';

import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';

/**
 * Semantic status tones. Kept intent-based (not color-named) so callers map a
 * domain state to a meaning and the palette stays centralized here.
 */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted/40 text-muted-foreground',
  info: 'border-brand-blue/25 bg-brand-blue/10 text-brand-blue',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500',
  danger: 'border-destructive/25 bg-destructive/10 text-destructive',
  brand: 'border-transparent bg-primary text-primary-foreground',
};

export interface StatusPillProps {
  tone?: StatusTone;
  children: ReactNode;
  /** Optional leading dot for a lighter, list-friendly indicator. */
  dot?: boolean;
  className?: string;
}

/**
 * Rounded-full status pill built on the shadcn Badge primitive (composition, not
 * a fork). Use for lifecycle/state labels across the admin portal so every status
 * reads consistently.
 */
export function StatusPill({ tone = 'neutral', children, dot = false, className }: StatusPillProps) {
  return (
    <Badge
      variant="outline"
      className={cn('h-6 gap-1.5 rounded-full border px-2.5 text-xs font-medium', TONE_CLASSES[tone], className)}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </Badge>
  );
}
