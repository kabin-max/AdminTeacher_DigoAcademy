import { z } from 'zod';

/** Difficulty levels mirror the Prisma `Difficulty` enum (kept local to decouple features). */
export const MARKETPLACE_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type MarketplaceDifficulty = (typeof MARKETPLACE_DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<MarketplaceDifficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const COURSE_SORTS = ['newest', 'rating', 'price-asc', 'price-desc'] as const;
export type CourseSort = (typeof COURSE_SORTS)[number];

export const COURSE_SORT_LABELS: Record<CourseSort, string> = {
  newest: 'Newest',
  rating: 'Top rated',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
};

export const PRICE_FILTERS = ['all', 'free', 'paid'] as const;
export type PriceFilter = (typeof PRICE_FILTERS)[number];

export interface CourseFilters {
  q: string;
  categoryId: string | null;
  difficulty: MarketplaceDifficulty | null;
  language: string | null;
  price: PriceFilter;
  sort: CourseSort;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const oneOf = <T extends readonly string[]>(
  value: string | undefined,
  allowed: T
): T[number] | null => (value && (allowed as readonly string[]).includes(value) ? value : null) as T[number] | null;

/**
 * Parse the marketplace query string into a typed, sanitized filter object.
 * Unknown/invalid values collapse to sensible defaults so the URL is the source of truth.
 */
export function parseCourseFilters(searchParams: RawSearchParams): CourseFilters {
  const q = (first(searchParams.q) ?? '').trim().slice(0, 100);
  const categoryId = first(searchParams.category)?.trim() || null;
  const difficulty = oneOf(first(searchParams.difficulty), MARKETPLACE_DIFFICULTIES);
  const language = first(searchParams.language)?.trim().slice(0, 20) || null;
  const price = oneOf(first(searchParams.price), PRICE_FILTERS) ?? 'all';
  const sort = oneOf(first(searchParams.sort), COURSE_SORTS) ?? 'newest';

  return { q, categoryId, difficulty, language, price, sort };
}
