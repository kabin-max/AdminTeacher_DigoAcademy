import { notFound } from 'next/navigation';

import { CourseDetailsForm } from '@/features/courses/components/CourseDetailsForm';
import { CourseStatusBadge } from '@/features/courses/components/CourseStatusBadge';
import { CurriculumEditor } from '@/features/courses/components/CurriculumEditor';
import { InstructorCourseActions } from '@/features/courses/components/InstructorCourseActions';
import type { CourseStatus } from '@/features/courses/lifecycle';
import { getCategoryChoices } from '@/features/categories/server/data';
import { getCourseForInstructor } from '@/features/courses/server/data';
import { requireRole } from '@/lib/auth/session';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { ROLES } from '@/shared/constants/roles';

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireRole(ROLES.INSTRUCTOR);
  const { courseId } = await params;

  const [course, categories] = await Promise.all([
    getCourseForInstructor(courseId, session.user.id),
    getCategoryChoices(),
  ]);
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          <div className="mt-1">
            <CourseStatusBadge status={course.status} reReviewFlagged={course.reReviewFlagged} />
          </div>
        </div>
        <InstructorCourseActions courseId={course.id} status={course.status as CourseStatus} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseDetailsForm
              categories={categories}
              mode="edit"
              courseId={course.id}
              defaultValues={{
                title: course.title,
                subtitle: course.subtitle ?? '',
                description: course.description ?? '',
                categoryId: course.categoryId ?? '',
                difficulty: course.difficulty,
                language: course.language,
                price: course.priceCents / 100,
                thumbnailKey: course.thumbnailKey ?? '',
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Curriculum</CardTitle>
          </CardHeader>
          <CardContent>
            <CurriculumEditor
              courseId={course.id}
              sections={course.sections.map((section) => ({
                id: section.id,
                title: section.title,
                lessons: section.lessons.map((lesson) => ({
                  id: lesson.id,
                  title: lesson.title,
                  type: lesson.type,
                  videoKey: lesson.videoKey,
                  videoDurationSec: lesson.videoDurationSec,
                  noteContent: lesson.noteContent,
                  notePdfKey: lesson.notePdfKey,
                  quiz: lesson.quiz
                    ? {
                        title: lesson.quiz.title,
                        description: lesson.quiz.description,
                        passingScore: lesson.quiz.passingScore,
                        timeLimitSec: lesson.quiz.timeLimitSec,
                        questions: lesson.quiz.questions.map((q) => ({
                          prompt: q.prompt,
                          explanation: q.explanation,
                          kind: q.kind,
                          choices: q.choices.map((c) => ({
                            text: c.text,
                            isCorrect: c.isCorrect,
                          })),
                        })),
                      }
                    : null,
                })),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
