import 'server-only';

import { toCategorySelectData } from '@/features/categories/tree';
import { db } from '@/lib/db';

/**
 * Full two-level tree for admin management and course tagging. Top-level
 * categories with their child leaves, each carrying a course-usage count.
 */
export async function getCategoryTree() {
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { courses: true } },
      children: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { courses: true } } },
      },
    },
  });
}

export type CategoryTreeNode = Awaited<ReturnType<typeof getCategoryTree>>[number];

/** Grouped category choices for the course tagging <select> (leaf-only). */
export async function getCategoryChoices() {
  return toCategorySelectData(await getCategoryTree());
}
