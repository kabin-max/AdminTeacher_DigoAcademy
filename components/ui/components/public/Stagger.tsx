'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Capped so a long grid never makes the tail item wait more than ~0.6s. */
const MAX_STAGGER = 0.06;

const container: Variants = {
  hidden: {},
  show: (staggerChildren: number) => ({
    transition: { staggerChildren, delayChildren: 0.04 },
  }),
};

const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(3px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE } },
};

/**
 * Orchestrates a true sibling stagger for grids that render as a list
 * (course cards, category tiles, instructor cards, stat tiles…). One
 * viewport observer drives every child instead of N independent ones.
 */
export function StaggerGroup({
  children,
  className,
  staggerChildren = MAX_STAGGER,
}: {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's entrance. */
  staggerChildren?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={container}
      custom={staggerChildren}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -8% 0px', amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={cn('will-change-transform', className)} variants={item}>
      {children}
    </motion.div>
  );
}
