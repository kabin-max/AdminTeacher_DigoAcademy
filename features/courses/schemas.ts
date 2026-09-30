import { z } from 'zod';

export const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export const LESSON_TYPES = ['VIDEO', 'NOTE', 'QUIZ', 'ASSIGNMENT'] as const;

const optionalText = (max: number) => z.union([z.string().max(max), z.literal('')]).optional();

export const courseDetailsSchema = z.object({
  title: z.string().min(3, 'Title is too short').max(150),
  subtitle: optionalText(200),
  /** HTML from the TipTap editor — allow room for markup overhead. */
  description: optionalText(20_000),
  categoryId: z.union([z.string(), z.literal('')]).optional(),
  difficulty: z.enum(DIFFICULTIES),
  language: z.string().min(2).max(20),
  /** Major currency units in the form; converted to integer cents server-side. */
  price: z.number().min(0, 'Price cannot be negative').max(100_000),
  thumbnailKey: optionalText(500),
});
export type CourseDetailsInput = z.infer<typeof courseDetailsSchema>;

export const sectionSchema = z.object({
  title: z.string().min(1, 'Section title is required').max(150),
});
export type SectionInput = z.infer<typeof sectionSchema>;

export const lessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required').max(150),
  type: z.enum(LESSON_TYPES),
  videoKey: optionalText(500),
  videoDurationSec: z.number().int().min(0).optional(),
  noteContent: optionalText(20_000),
  notePdfKey: optionalText(500),
});
export type LessonInput = z.infer<typeof lessonSchema>;

/** Content payload for an existing lesson (video/note); title & type edited separately. */
export const lessonContentSchema = z.object({
  videoKey: optionalText(500),
  videoDurationSec: z.number().int().min(0).max(360_000).optional(),
  noteContent: optionalText(20_000),
  notePdfKey: optionalText(500),
});
export type LessonContentInput = z.infer<typeof lessonContentSchema>;

/** Fields whose change on a PUBLISHED course triggers a re-review flag. */
export const RE_REVIEW_FIELDS = ['price', 'title', 'description'] as const;

// ---------------------------------------------------------------------------
// Quizzes — authored per QUIZ lesson. A question is either single-answer
// (radio: exactly one correct choice) or multiple-answer (checkbox: 1+ correct).
// ---------------------------------------------------------------------------

export const QUESTION_KINDS = ['SINGLE', 'MULTIPLE'] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

const quizChoiceSchema = z.object({
  text: z.string().min(1, 'Choice text is required').max(500),
  isCorrect: z.boolean(),
});

const quizQuestionSchema = z
  .object({
    prompt: z.string().min(1, 'Question text is required').max(1000),
    explanation: optionalText(4_000),
    kind: z.enum(QUESTION_KINDS),
    choices: z.array(quizChoiceSchema).min(2, 'Add at least two choices').max(10),
  })
  .refine((q) => q.choices.some((c) => c.isCorrect), {
    message: 'Mark at least one correct choice',
    path: ['choices'],
  })
  .refine((q) => q.kind === 'MULTIPLE' || q.choices.filter((c) => c.isCorrect).length === 1, {
    message: 'Single-answer questions need exactly one correct choice',
    path: ['choices'],
  });

export const quizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required').max(150),
  description: optionalText(2_000),
  passingScore: z.number().int('Whole number').min(0).max(100),
  timeLimitSec: z.number().int().min(0).max(86_400).optional(),
  questions: z.array(quizQuestionSchema).min(1, 'Add at least one question').max(100),
});
export type QuizInput = z.infer<typeof quizSchema>;
