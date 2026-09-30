'use server';

import { revalidatePath } from 'next/cache';

import {
  createCategorySchema,
  renameCategorySchema,
  type CreateCategoryInput,
} from '@/features/categories/schemas';
import { slugify } from '@/features/categories/slug';
import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}
export interface CreateCategoryResult extends ActionResult {
  categoryId?: string;
}

const emptyToNull = (value: string | undefined) => (value && value.length > 0 ? value : null);

/** Generate a globally-unique slug, prefixing the parent's slug for children. */
async function uniqueSlug(name: string, parentSlug: string | null): Promise<string> {
  const base = [parentSlug, slugify(name)].filter(Boolean).join('-') || 'category';
  let candidate = base;
  let n = 2;
  // Bounded loop — slug is globally unique, so probe until a free one is found.
  while (await db.category.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

export async function createCategory(input: CreateCategoryInput): Promise<CreateCategoryResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please enter a valid name.' };
  const { name } = parsed.data;
  const parentId = emptyToNull(parsed.data.parentId);

  let parentSlug: string | null = null;
  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId } });
    if (!parent) return { ok: false, error: 'Parent category not found.' };
    // Enforce the two-level limit: you cannot nest under an existing child.
    if (parent.parentId) {
      return { ok: false, error: 'Categories can only be nested one level deep.' };
    }
    parentSlug = parent.slug;
  }

  const slug = await uniqueSlug(name, parentSlug);

  try {
    const category = await db.category.create({ data: { name, slug, parentId } });
    await recordAudit({
      actorId: session.user.id,
      action: 'category.created',
      entityType: 'Category',
      entityId: category.id,
      metadata: { name, parentId },
    });
    revalidatePath('/admin/categories');
    return { ok: true, categoryId: category.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: 'A category with that name already exists here.' };
    }
    throw error;
  }
}

export async function renameCategory(id: string, input: { name: string }): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = renameCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please enter a valid name.' };

  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Category not found.' };

  try {
    // Slug is left stable so existing links keep working; only the label changes.
    await db.category.update({ where: { id }, data: { name: parsed.data.name } });
    await recordAudit({
      actorId: session.user.id,
      action: 'category.renamed',
      entityType: 'Category',
      entityId: id,
      metadata: { from: existing.name, to: parsed.data.name },
    });
    revalidatePath('/admin/categories');
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: 'A category with that name already exists here.' };
    }
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { courses: true, children: true } } },
  });
  if (!category) return { ok: false, error: 'Category not found.' };

  if (category._count.children > 0) {
    return { ok: false, error: 'Remove or reassign its subcategories first.' };
  }
  if (category._count.courses > 0) {
    const n = category._count.courses;
    return {
      ok: false,
      error: `${n} course${n === 1 ? '' : 's'} still use this category — reassign them first.`,
    };
  }

  await db.category.delete({ where: { id } });
  await recordAudit({
    actorId: session.user.id,
    action: 'category.deleted',
    entityType: 'Category',
    entityId: id,
    metadata: { name: category.name },
  });
  revalidatePath('/admin/categories');
  return { ok: true };
}

/** Prisma unique-constraint violation (e.g. duplicate sibling name). */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
