import type { ReactNode } from 'react';

import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';

export interface PanelProps {
  children: ReactNode;
  className?: string;
  /** Inner padding preset. */
  padding?: 'none' | 'default';
}

/**
 * Soft rounded surface (Jobie-style) built on the shadcn Card primitive via
 * composition — the generated Card is not modified. Use for content sections,
 * table containers, and dashboard panels so surfaces read consistently.
 */
export function Panel({ children, className, padding = 'default' }: PanelProps) {
  return (
    <Card
      className={cn(
        'gap-0 rounded-2xl border border-border/70 shadow-sm ring-0',
        padding === 'default' ? 'p-6' : 'p-0 overflow-hidden',
        className
      )}
    >
      {children}
    </Card>
  );
}
