'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Counts up from 0 to `value` once it scrolls into view — makes the stats
 * band read as a live measurement rather than static copy. Honors
 * `prefers-reduced-motion` by rendering the final value immediately.
 *
 * `compact`/`suffix` (rather than a `format` callback) so this can be
 * dropped straight into a Server Component: functions aren't serializable
 * across the RSC boundary, only plain data.
 */
export function CountUp({
  value,
  end,
  suffix = '',
  compact = false,
  className,
  duration = 1.4,
}: {
  value?: number;
  /** Alias for `value` to support standard count-up conventions */
  end?: number;
  suffix?: string;
  /** Format large numbers as "1.2K" instead of "1200". */
  compact?: boolean;
  className?: string;
  duration?: number;
}) {
  const targetValue = value ?? end ?? 0;
  const format = (n: number) =>
    `${
      compact
        ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
        : Math.round(n)
    }${suffix}`;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? targetValue : 0);

  useEffect(() => {
    // Reduced-motion renders the final value straight away via useState's
    // initializer above — nothing to animate here.
    if (!inView || reduceMotion) return;
    const controls = animate(0, targetValue, {
      duration,
      ease: EASE,
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, targetValue, duration, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
