import { z } from 'zod';

const optionalId = z
  .union([z.string(), z.literal('')])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const optionalDate = z
  .union([z.string(), z.literal('')])
  .optional()
  .transform((value) => (value && value.length > 0 ? new Date(value) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), 'Invalid date.');

const optionalCapacity = z
  .union([z.coerce.number().int().positive().max(100_000), z.literal('')])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value));

const batchName = z
  .string()
  .trim()
  .min(1, 'Batch name is required.')
  .min(2, 'Batch name must be at least 2 characters.')
  .max(80, 'Batch name is too long.');

export const createBatchSchema = z.object({
  name: batchName,
  courseId: z.string().min(1, 'Choose a course.'),
  instructorId: optionalId,
  startDate: optionalDate,
  endDate: optionalDate,
  capacity: optionalCapacity,
});
export type CreateBatchInput = z.input<typeof createBatchSchema>;

export const updateBatchSchema = createBatchSchema.extend({ id: z.string().min(1) });
export type UpdateBatchInput = z.input<typeof updateBatchSchema>;

/** Instructor-facing: only the class schedule (drives the recurring Meet link). */
export const updateBatchScheduleSchema = z.object({
  id: z.string().min(1),
  startDate: optionalDate,
  endDate: optionalDate,
});
export type UpdateBatchScheduleInput = z.input<typeof updateBatchScheduleSchema>;

const learningPlanName = z
  .string()
  .trim()
  .min(1, 'Learning plan name is required.')
  .min(2, 'Learning plan name must be at least 2 characters.')
  .max(80, 'Learning plan name is too long.');

export const createLearningPlanSchema = z.object({
  name: learningPlanName,
  courseId: z.string().min(1, 'Choose a course.'),
  description: z.string().trim().max(500).optional(),
});
export type CreateLearningPlanInput = z.input<typeof createLearningPlanSchema>;

export const updateLearningPlanSchema = createLearningPlanSchema.extend({ id: z.string().min(1) });
export type UpdateLearningPlanInput = z.input<typeof updateLearningPlanSchema>;
