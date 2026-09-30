import { z } from 'zod';

/**
 * Validates a CourseDraft posted back for import. Intentionally lenient on
 * per-question shape — quality filtering (2+ choices, exactly one correct) is
 * done by `isValidQuestion`/`moduleLessons` so one malformed question doesn't
 * reject the whole import.
 */

const headedBlockSchema = z.object({
  heading: z.string().max(300),
  body: z.string().max(20_000),
});

export const choiceDraftSchema = z.object({
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
});

export const questionDraftSchema = z.object({
  prompt: z.string().min(1).max(2000),
  explanation: z.string().max(4000).nullable(),
  choices: z.array(choiceDraftSchema).max(10),
});

export const moduleDraftSchema = z.object({
  title: z.string().min(1).max(300),
  overview: z.string().max(10_000),
  objectives: z.array(z.string().max(1000)).max(50),
  topics: z.array(headedBlockSchema).max(50),
  activities: z.array(headedBlockSchema).max(50),
  questions: z.array(questionDraftSchema).max(100),
});

export const courseDraftSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000),
  modules: z.array(moduleDraftSchema).min(1).max(100),
});
