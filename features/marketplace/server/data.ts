import 'server-only';

import type { CourseFilters } from '@/features/marketplace/schemas';
import { db } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/client';
import { isS3Configured, presignDownload } from '@/lib/storage';

/**
 * Resolve S3 thumbnail keys to short-lived signed URLs. Returns null when storage
 * is not configured (dev) or the course has no thumbnail, so callers render a
 * placeholder instead.
 */
async function resolveThumbnail(key: string | null): Promise<string | null> {
  if (!key || !isS3Configured) return null;
  try {
    return await presignDownload(key);
  } catch {
    return null;
  }
}

function buildWhere(filters: CourseFilters): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = { status: 'PUBLISHED' };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { subtitle: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.difficulty) where.difficulty = filters.difficulty;
  if (filters.language) where.language = filters.language;
  if (filters.price === 'free') where.priceCents = 0;
  if (filters.price === 'paid') where.priceCents = { gt: 0 };

  return where;
}

function buildOrderBy(sort: CourseFilters['sort']): Prisma.CourseOrderByWithRelationInput {
  switch (sort) {
    case 'rating':
      return { ratingAvg: 'desc' };
    case 'price-asc':
      return { priceCents: 'asc' };
    case 'price-desc':
      return { priceCents: 'desc' };
    default:
      return { createdAt: 'desc' };
  }
}

/** Published courses for the student marketplace, filtered + sorted by the URL query. */
export async function getPublishedCourses(filters: CourseFilters) {
  const courses = await db.course.findMany({
    where: buildWhere(filters),
    orderBy: buildOrderBy(filters.sort),
    include: {
      category: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true } },
      _count: { select: { sections: true, enrollments: true, reviews: true } },
    },
  });

  return Promise.all(
    courses.map(async (course) => ({
      ...course,
      thumbnailUrl: await resolveThumbnail(course.thumbnailKey),
    }))
  );
}

export type MarketplaceCourse = Awaited<ReturnType<typeof getPublishedCourses>>[number];

/** A single published course with its curriculum outline and recent reviews. */
export async function getMarketplaceCourse(courseId: string) {
  const course = await db.course.findFirst({
    where: { id: courseId, status: 'PUBLISHED' },
    include: {
      category: { select: { id: true, name: true } },
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
          instructorProfile: {
            select: { headline: true, ratingAvg: true, totalStudents: true },
          },
        },
      },
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, type: true, videoDurationSec: true },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          rating: true,
          text: true,
          createdAt: true,
          student: { select: { name: true, image: true } },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course) return null;
  return { ...course, thumbnailUrl: await resolveThumbnail(course.thumbnailKey) };
}

export type MarketplaceCourseDetail = NonNullable<Awaited<ReturnType<typeof getMarketplaceCourse>>>;

/** Top instructors with published courses, for the homepage — best-rated first. */
export async function getFeaturedInstructors(limit = 8) {
  return db.user.findMany({
    where: { role: 'INSTRUCTOR', coursesAuthored: { some: { status: 'PUBLISHED' } } },
    orderBy: [{ instructorProfile: { ratingAvg: 'desc' } }, { createdAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      name: true,
      image: true,
      instructorProfile: { select: { headline: true, ratingAvg: true, totalStudents: true } },
    },
  });
}

export type FeaturedInstructor = Awaited<ReturnType<typeof getFeaturedInstructors>>[number];

/** Headline platform metrics for the homepage stats band. */
export async function getPlatformStats() {
  const [courses, students, instructors, categories] = await Promise.all([
    db.course.count({ where: { status: 'PUBLISHED' } }),
    db.user.count({ where: { role: 'STUDENT' } }),
    db.user.count({ where: { role: 'INSTRUCTOR' } }),
    db.category.count(),
  ]);
  return { courses, students, instructors, categories };
}

/** Categories that currently have published courses, with a usage count. */
export async function getBrowseCategories(limit = 8) {
  const categories = await db.category.findMany({
    where: { courses: { some: { status: 'PUBLISHED' } } },
    orderBy: { name: 'asc' },
    take: limit,
    select: {
      id: true,
      name: true,
      _count: { select: { courses: true } },
    },
  });
  return categories;
}

/** Distinct filter options (categories in use, languages) drawn from published courses. */
export async function getMarketplaceFilterOptions() {
  const [categories, languages] = await Promise.all([
    db.category.findMany({
      where: { courses: { some: { status: 'PUBLISHED' } } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    db.course.findMany({
      where: { status: 'PUBLISHED' },
      distinct: ['language'],
      orderBy: { language: 'asc' },
      select: { language: true },
    }),
  ]);

  return { categories, languages: languages.map((l) => l.language) };
}
