import { CreateQuizModal } from '@/features/quizzes/components/CreateQuizModal';
import { AdminQuizList } from '@/features/quizzes/components/AdminQuizList';
import { getInstructorCourseOptions, getInstructorQuizzes } from '@/features/quizzes/server/data';
import { requireRole } from '@/lib/auth/session';
import { ROLES } from '@/shared/constants/roles';

export default async function InstructorQuizzesPage() {
  const session = await requireRole(ROLES.INSTRUCTOR);
  const [quizzes, courseOptions] = await Promise.all([
    getInstructorQuizzes(session.user.id),
    getInstructorCourseOptions(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Standalone management for all quizzes across your courses.
          </p>
        </div>
        <CreateQuizModal courses={courseOptions} />
      </div>

      <AdminQuizList quizzes={quizzes} />
    </div>
  );
}
