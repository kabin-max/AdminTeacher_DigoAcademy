import { notFound } from 'next/navigation';

import { AdminReviewActions } from '@/features/courses/components/AdminReviewActions';
import { CourseDetailsForm } from '@/features/courses/components/CourseDetailsForm';
import { CourseStatusBadge } from '@/features/courses/components/CourseStatusBadge';
import { CurriculumEditor } from '@/features/courses/components/CurriculumEditor';
import { DeleteCourseButton } from '@/features/courses/components/DeleteCourseButton';
import type { CourseStatus } from '@/features/courses/lifecycle';
import { getCategoryChoices } from '@/features/categories/server/data';
import { getCourseForAdmin } from '@/features/courses/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminCourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireRole(ROLES.ADMIN);
  const { courseId } = await params;

  const [course, categories] = await Promise.all([
    getCourseForAdmin(courseId),
    getCategoryChoices(),
  ]);
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Courses', href: '/admin/courses' },
        ]}
        title={course.title}
        description={
          <div className="space-y-1.5">
            <p>
              Author: {course.instructor.name} ({course.instructor.email})
            </p>
            <CourseStatusBadge status={course.status} reReviewFlagged={course.reReviewFlagged} />
          </div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AdminReviewActions
              courseId={course.id}
              status={course.status as CourseStatus}
              reReviewFlagged={course.reReviewFlagged}
            />
            <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
          </div>
        }
      />

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
              builderBasePath="/admin/courses"
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
