'use client';

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { Menu, X, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const NAV_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/courses', label: 'Courses' },
  { href: '/instructors', label: 'Instructors' },
  { href: '/contact', label: 'Contact' },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Client shell for the public header: scroll-aware chrome plus an animated
 * mobile nav drawer (the desktop nav is hidden below `sm`, so small-screen
 * visitors previously had no way to reach `/courses` at all).
 */
export function HeaderBar({ home }: { home: string | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openForPathname, setOpenForPathname] = useState(pathname);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 8);
  });

  // Close the drawer on route change — adjusted during render (React's
  // recommended pattern for resetting state when a prop changes) rather
  // than in an effect, so it can't flash open before the reset runs.
  if (pathname !== openForPathname) {
    setOpenForPathname(pathname);
    if (open) setOpen(false);
  }

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-background/80 backdrop-blur transition-shadow duration-300 flex flex-col',
        scrolled ? 'border-border/80 shadow-sm' : 'border-transparent'
      )}
    >
      <div className="group flex h-10 w-full items-center overflow-hidden bg-brand-blue text-xs sm:text-sm text-white">
        <div className="flex w-max animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center">
              <span className="mx-6 font-medium">Inquiry :</span>
              <span className="mr-6 flex items-center gap-1.5"><Phone className="size-3.5" /> +977 9801820900</span>
              <span className="mr-6 flex items-center gap-1.5">
                <Mail className="size-3.5" /> <a href="mailto:info@digoacademy.com" className="hover:underline">info@digoacademy.com</a>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Digo Academy home" className="shrink-0">
          <BrandLogo className="h-12" />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <HeaderActions home={home} />
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted sm:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'open'}
                initial={reduceMotion ? false : { opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, rotate: 45 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="flex"
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden border-t border-border/60 sm:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
                <HeaderActions home={home} stacked />
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function HeaderActions({ home, stacked = false }: { home: string | null; stacked?: boolean }) {
  const ctaClass = cn(
    stacked && 'w-full'
  );

  if (home) {
    return (
      <Button className={ctaClass} nativeButton={false} render={<Link href={home}>Go to dashboard</Link>} />
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        className={cn('rounded-full', stacked && 'w-full')}
        nativeButton={false}
        render={<Link href="/login">Login</Link>}
      />
      <Button className={ctaClass} nativeButton={false} render={<Link href="/register">Signup</Link>} />
    </>
  );
}
