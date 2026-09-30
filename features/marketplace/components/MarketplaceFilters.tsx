'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  COURSE_SORTS,
  COURSE_SORT_LABELS,
  DIFFICULTY_LABELS,
  MARKETPLACE_DIFFICULTIES,
  PRICE_FILTERS,
  type CourseFilters,
} from '@/features/marketplace/schemas';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

const PRICE_LABELS: Record<(typeof PRICE_FILTERS)[number], string> = {
  all: 'All prices',
  free: 'Free',
  paid: 'Paid',
};

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export function MarketplaceFilters({
  filters,
  categories,
  languages,
}: {
  filters: CourseFilters;
  categories: { id: string; name: string }[];
  languages: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(filters.q);

  // Keep the local search box in sync when the URL changes (e.g. reset/back).
  useEffect(() => {
    setQ(filters.q);
  }, [filters.q]);

  function apply(patch: Partial<Record<string, string>>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters =
    filters.q ||
    filters.categoryId ||
    filters.difficulty ||
    filters.language ||
    filters.price !== 'all' ||
    filters.sort !== 'newest';

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: q.trim() || undefined });
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses…"
          className="h-10 pl-9"
          aria-label="Search courses"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className={cn(selectClass)}
          value={filters.categoryId ?? ''}
          onChange={(e) => apply({ category: e.target.value || undefined })}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className={cn(selectClass)}
          value={filters.difficulty ?? ''}
          onChange={(e) => apply({ difficulty: e.target.value || undefined })}
          aria-label="Difficulty"
        >
          <option value="">All levels</option>
          {MARKETPLACE_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABELS[d]}
            </option>
          ))}
        </select>

        {languages.length > 1 ? (
          <select
            className={cn(selectClass)}
            value={filters.language ?? ''}
            onChange={(e) => apply({ language: e.target.value || undefined })}
            aria-label="Language"
          >
            <option value="">All languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        ) : null}

        <select
          className={cn(selectClass)}
          value={filters.price}
          onChange={(e) => apply({ price: e.target.value === 'all' ? undefined : e.target.value })}
          aria-label="Price"
        >
          {PRICE_FILTERS.map((p) => (
            <option key={p} value={p}>
              {PRICE_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          className={cn(selectClass, 'ml-auto')}
          value={filters.sort}
          onChange={(e) => apply({ sort: e.target.value === 'newest' ? undefined : e.target.value })}
          aria-label="Sort by"
        >
          {COURSE_SORTS.map((s) => (
            <option key={s} value={s}>
              {COURSE_SORT_LABELS[s]}
            </option>
          ))}
        </select>

        {hasFilters ? (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
