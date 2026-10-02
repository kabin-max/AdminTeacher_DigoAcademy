import { CreateQuizModal } from '@/features/quizzes/components/CreateQuizModal';
import { AdminQuizList } from '@/features/quizzes/components/AdminQuizList';
import { getAdminQuizzes, getInstructorCourseOptions } from '@/features/quizzes/server/data';
import { requireRole } from '@/lib/auth/session';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminQuizzesPage() {
  const session = await requireRole(ROLES.ADMIN);
  const [quizzes, courseOptions] = await Promise.all([
    getAdminQuizzes(),
    getInstructorCourseOptions(session.user.id, true),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quizzes (Admin)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview and creation of quizzes across the platform.
          </p>
        </div>
        <CreateQuizModal courses={courseOptions} />
      </div>

      <AdminQuizList quizzes={quizzes} />
    </div>
  );
}
