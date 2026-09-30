'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

const EASE = [0.16, 1, 0.3, 1] as const;

const variants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
};

/**
 * Reveals its children with a fade-rise-focus once they scroll into view.
 * Server Components can be passed as `children` (they render on the server and
 * are handed to this client wrapper). Honors `prefers-reduced-motion`.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds. */
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn('will-change-transform', className)}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -8% 0px', amount: 0.12 }}
      transition={{ delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}
