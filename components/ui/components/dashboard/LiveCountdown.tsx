'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/shared/utils/cn';

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Ticking countdown to a session's start. Shows "LIVE NOW" once the target has
 * passed (or when `live` is set). Renders a stable placeholder on the server (and
 * until the first tick) to avoid hydration mismatch and a render-phase `Date.now()` call.
 *
 * `muted` swaps the pill from light-on-color (the student live hero, on a
 * gradient background) to a neutral `bg-muted` pill (plain dashboard cards).
 */
export function LiveCountdown({
  target,
  live = false,
  muted = false,
  className,
}: {
  target: string;
  live?: boolean;
  muted?: boolean;
  className?: string;
}) {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const pillClass = cn(
    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide tabular-nums',
    muted ? 'bg-muted text-foreground' : 'bg-white/20',
    className
  );

  if (now === null) {
    return (
      <span className={pillClass}>
        <span className="size-2 rounded-full bg-emerald-300" />
        Live in --:--:--
      </span>
    );
  }

  const remaining = targetMs - now;

  if (live || remaining <= 0) {
    return (
      <span className={pillClass}>
        <span className="size-2 animate-pulse rounded-full bg-brand-coral" />
        Live now
      </span>
    );
  }

  return (
    <span className={pillClass}>
      <span className="size-2 rounded-full bg-emerald-300" />
      Live in {format(remaining)}
    </span>
  );
}
