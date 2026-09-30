import { Star, Users } from 'lucide-react';
import Link from 'next/link';

import { CourseThumbnail } from '@/features/marketplace/components/CourseThumbnail';
import type { MarketplaceCourse } from '@/features/marketplace/server/data';
import { DIFFICULTY_LABELS, type MarketplaceDifficulty } from '@/features/marketplace/schemas';
import { WishlistButton } from '@/features/wishlist/components/WishlistButton';
import { formatMoney } from '@/shared/utils/money';

export function CourseCard({
  course,
  wishlisted = false,
  hrefBase = '/student/courses',
  showWishlist = true,
}: {
  course: MarketplaceCourse;
  wishlisted?: boolean;
  /** Route prefix for the course link — e.g. `/courses` for the public site. */
  hrefBase?: string;
  /** Wishlist is student-only; hide it on the public catalog. */
  showWishlist?: boolean;
}) {
  const href = `${hrefBase}/${course.id}`;
  const isFree = course.priceCents === 0;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-brand-blue/30">
      {showWishlist && (
        <div className="absolute right-3 top-3 z-20">
          <WishlistButton courseId={course.id} initialWishlisted={wishlisted} />
        </div>
      )}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <div className="size-full transition-transform duration-500 group-hover:scale-105">
          <CourseThumbnail title={course.title} url={course.thumbnailUrl} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* price chip */}
        <span
          className={
            isFree
              ? 'absolute left-3 top-3 z-10 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm'
              : 'absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-blue shadow-sm'
          }
        >
          {isFree ? 'Free' : formatMoney(course.priceCents, course.currency)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {course.category ? (
            <span className="truncate font-medium text-brand-blue">{course.category.name}</span>
          ) : null}
          <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 font-medium">
            {DIFFICULTY_LABELS[course.difficulty as MarketplaceDifficulty]}
          </span>
        </div>
        <Link
          href={href}
          className="line-clamp-2 font-heading font-semibold leading-snug transition-colors after:absolute after:inset-0 group-hover:text-brand-blue"
        >
          {course.title}
        </Link>
        {course.subtitle ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-[0.7rem] font-semibold text-brand-blue">
              {course.instructor.name
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p.charAt(0).toUpperCase())
                .join('')}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {course.instructor.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            {course.ratingAvg > 0 ? (
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {course.ratingAvg.toFixed(1)}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                New
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {course._count.enrollments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
