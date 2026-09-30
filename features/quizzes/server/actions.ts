'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
  quizId?: string;
}

const choiceSchema = z.object({
  text: z.string().trim().min(1, 'Choice text is required.'),
  isCorrect: z.boolean(),
});

const questionSchema = z
  .object({
    prompt: z.string().trim().min(1, 'Question prompt is required.'),
    explanation: z.string().optional(),
    kind: z.enum(['SINGLE', 'MULTIPLE']),
    choices: z.array(choiceSchema).min(2, 'At least 2 choices are required.'),
  })
  .refine((q) => q.choices.some((c) => c.isCorrect), {
    message: 'Each question must have at least one correct answer.',
  });

const createStandaloneQuizSchema = z.object({
  courseId: z.string().min(1, 'Course is required.'),
  sectionId: z.string().optional(),
  newSectionTitle: z.string().optional(),
  title: z.string().trim().min(1, 'Quiz title is required.'),
  description: z.string().optional(),
  passingScore: z.number().int().min(1).max(100).default(80),
  timeLimitMin: z.number().optional(),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
});

export type CreateStandaloneQuizInput = z.infer<typeof createStandaloneQuizSchema>;

export async function createStandaloneQuiz(
  input: CreateStandaloneQuizInput
): Promise<ActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createStandaloneQuizSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  const isAdmin = session.user.role === ROLES.ADMIN;
  const course = await db.course.findFirst({
    where: isAdmin ? { id: data.courseId } : { id: data.courseId, instructorId: session.user.id },
    select: { id: true },
  });
  if (!course) return { ok: false, error: 'Course not found or unauthorized.' };

  let sectionId = data.sectionId;
  if (!sectionId) {
    const sectionTitle = data.newSectionTitle?.trim() || 'Quizzes & Assessments';
    const existingSection = await db.section.findFirst({
      where: { courseId: data.courseId, title: sectionTitle },
      select: { id: true },
    });

    if (existingSection) {
      sectionId = existingSection.id;
    } else {
      const sectionCount = await db.section.count({ where: { courseId: data.courseId } });
      const createdSection = await db.section.create({
        data: { courseId: data.courseId, title: sectionTitle, order: sectionCount },
      });
      sectionId = createdSection.id;
    }
  }

  const lessonCount = await db.lesson.count({ where: { sectionId } });

  const result = await db.$transaction(async (tx) => {
    const lesson = await tx.lesson.create({
      data: {
        sectionId,
        title: data.title,
        type: 'QUIZ',
        order: lessonCount,
      },
    });

    const quiz = await tx.quiz.create({
      data: {
        lessonId: lesson.id,
        title: data.title,
        description: data.description || null,
        passingScore: data.passingScore,
        timeLimitSec: data.timeLimitMin ? data.timeLimitMin * 60 : null,
      },
    });

    for (const [qIndex, question] of data.questions.entries()) {
      await tx.question.create({
        data: {
          quizId: quiz.id,
          prompt: question.prompt,
          explanation: question.explanation || null,
          kind: question.kind,
          order: qIndex,
          choices: {
            create: question.choices.map((choice) => ({
              text: choice.text,
              isCorrect: choice.isCorrect,
            })),
          },
        },
      });
    }

    return quiz;
  });

  await recordAudit({
    actorId: session.user.id,
    action: 'quiz.created',
    entityType: 'Quiz',
    entityId: result.id,
    metadata: { courseId: data.courseId, title: data.title },
  });

  revalidatePath('/instructor/quizzes');
  revalidatePath('/admin/quizzes');
  revalidatePath(`/instructor/courses/${data.courseId}`);
  return { ok: true, quizId: result.id };
}
