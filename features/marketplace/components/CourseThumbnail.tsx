import { GraduationCap } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

function initials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Course cover image. Falls back to a branded gradient tile with the course
 * initials when no signed thumbnail URL is available (e.g. storage not configured).
 */
export function CourseThumbnail({
  title,
  url,
  className,
}: {
  title: string;
  url: string | null;
  className?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- signed S3 URLs are not loader-friendly
    return (
      <img
        src={url}
        alt={title}
        className={cn('h-full w-full object-cover', className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-brand-blue via-indigo-500 to-violet-500',
        className
      )}
      aria-hidden
    >
      {/* soft colour blobs */}
      <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-white/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 size-32 rounded-full bg-brand-coral/30 blur-2xl" />
      {/* dotted texture */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.15]" />
      <GraduationCap className="pointer-events-none absolute right-3 top-3 size-6 text-white/40" />
      <span className="relative flex size-20 items-center justify-center rounded-2xl bg-white/15 font-heading text-3xl font-semibold tracking-tight text-white ring-1 ring-white/25 backdrop-blur-sm">
        {initials(title)}
      </span>
    </div>
  );
}
