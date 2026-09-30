'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react';
import { type PointerEvent, type ReactNode, useRef } from 'react';

import { cn } from '@/shared/utils/cn';

const EASE = [0.16, 1, 0.3, 1] as const;

/* -------------------------------------------------------------------------- */
/* Hero stage — the one load-triggered, authored entrance on the site.        */
/* -------------------------------------------------------------------------- */

const stageVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: EASE } },
};

/** Wraps the hero content; children opt into the cascade with `HeroItem`. */
export function HeroStage({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={stageVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={cn('will-change-transform', className)} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Headline — per-word cascade so the promise reads like it's being typeset   */
/* into place, not just faded in.                                             */
/* -------------------------------------------------------------------------- */

const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.2 } },
};

const word: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE } },
};

export function HeroHeadline({
  segments,
  className,
}: {
  segments: { text: string; accent?: boolean }[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <h1 className={className}>
        {segments.map((segment, index) => (
          <span key={index} className={segment.accent ? 'text-brand-blue' : undefined}>
            {segment.text}
            {index < segments.length - 1 ? ' ' : ''}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <motion.h1
      className={className}
      variants={wordContainer}
      initial="hidden"
      animate="show"
      aria-label={segments.map((s) => s.text).join(' ')}
    >
      {segments.map((segment, index) => (
        <motion.span
          key={index}
          variants={word}
          aria-hidden
          className={cn('inline-block whitespace-pre will-change-transform', segment.accent && 'text-brand-blue')}
        >
          {segment.text}
          {index < segments.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.h1>
  );
}

/* -------------------------------------------------------------------------- */
/* Product preview — tilts into place, drifts gently, and parallaxes on       */
/* scroll. The one piece of continuous motion on the page.                    */
/* -------------------------------------------------------------------------- */

const previewVariants: Variants = {
  hidden: { opacity: 0, y: 36, rotateX: 8, scale: 0.97, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE },
  },
};

export function HeroPreview({
  children,
  className,
  'aria-hidden': ariaHidden,
}: {
  children: ReactNode;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawParallax = useTransform(scrollYProgress, [0, 1], [-18, 18]);
  const parallaxY = useSpring(rawParallax, { stiffness: 120, damping: 24, mass: 0.4 });

  if (reduceMotion) {
    return (
      <div ref={ref} className={className} style={{ perspective: 1200 }} aria-hidden={ariaHidden}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={cn('will-change-transform', className)}
      style={{ perspective: 1200, y: parallaxY }}
      variants={previewVariants}
      aria-hidden={ariaHidden}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Magnetic CTA — the primary hero action leans toward the cursor. Subtle,    */
/* fine-pointer only, and inert under reduced motion.                        */
/* -------------------------------------------------------------------------- */

export function Magnetic({ children, className, strength = 10 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, { stiffness: 300, damping: 20, mass: 0.4 });
  const y = useSpring(0, { stiffness: 300, damping: 20, mass: 0.4 });

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set(((event.clientX - rect.left - rect.width / 2) / rect.width) * strength);
    y.set(((event.clientY - rect.top - rect.height / 2) / rect.height) * strength);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.div>
  );
}
