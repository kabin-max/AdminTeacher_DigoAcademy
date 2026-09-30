'use server';

import { revalidatePath } from 'next/cache';

import { extractCourseDraft } from '@/features/course-import/server/extract';
import { moduleLessons, type CourseDraft } from '@/features/course-import/parse';
import { courseDraftSchema } from '@/features/course-import/schemas';
import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ParseResult {
  ok: boolean;
  error?: string;
  draft?: CourseDraft;
}
export interface ImportResult {
  ok: boolean;
  error?: string;
  courseId?: string;
}

const MAX_BYTES = 10 * 1024 * 1024;
const moduleLabel = (index: number) => `Module ${String(index + 1).padStart(2, '0')}`;

/** Step 1: parse an uploaded .docx into a CourseDraft for preview (no writes). */
export async function parseCourseUpload(formData: FormData): Promise<ParseResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'No file uploaded.' };
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return { ok: false, error: 'Please upload a Word .docx file.' };
  }
  if (file.size > MAX_BYTES) return { ok: false, error: 'File too large (max 10 MB).' };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const draft = await extractCourseDraft(buffer);
    if (draft.modules.length === 0) {
      return { ok: false, error: 'No modules found — check the document follows the expected format.' };
    }
    return { ok: true, draft };
  } catch {
    return { ok: false, error: 'Could not read that document.' };
  }
}

/** Step 2: write the (previewed) draft as a new DRAFT course, sections & lessons. */
export async function importCourseDraft(input: CourseDraft): Promise<ImportResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = courseDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'The parsed course was invalid.' };
  const draft = parsed.data;

  const course = await db.course.create({
    data: {
      title: draft.title,
      description: draft.description || null,
      status: 'DRAFT',
      instructorId: session.user.id,
      sections: {
        create: draft.modules.map((mod, mi) => ({
          title: `${moduleLabel(mi)} · ${mod.title}`.trim(),
          order: mi,
          lessons: {
            create: moduleLessons(mod).map((lesson, li) => ({
              title: lesson.title,
              type: lesson.type,
              order: li,
              noteContent: lesson.noteContent ?? null,
              ...(lesson.quiz
                ? {
                    quiz: {
                      create: {
                        title: lesson.quiz.title,
                        questions: {
                          create: lesson.quiz.questions.map((q, qi) => ({
                            prompt: q.prompt,
                            explanation: q.explanation,
                            kind: 'SINGLE' as const,
                            order: qi,
                            choices: {
                              create: q.choices.map((c) => ({
                                text: c.text,
                                isCorrect: c.isCorrect,
                              })),
                            },
                          })),
                        },
                      },
                    },
                  }
                : {}),
            })),
          },
        })),
      },
    },
  });

  await recordAudit({
    actorId: session.user.id,
    action: 'course.imported',
    entityType: 'Course',
    entityId: course.id,
    metadata: { modules: draft.modules.length, source: 'docx' },
  });

  revalidatePath('/admin/courses');
  return { ok: true, courseId: course.id };
}
