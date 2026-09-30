import { z } from 'zod';

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, 'Category name is required.')
  .min(2, 'Category name must be at least 2 characters.')
  .max(60, 'Category name is too long.');

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  /** Empty / omitted = a top-level category. Otherwise the parent's id. */
  parentId: z.union([z.string(), z.literal('')]).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const renameCategorySchema = z.object({ name: categoryNameSchema });
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;
