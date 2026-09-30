import { HelpCircle } from 'lucide-react';
import Link from 'next/link';

import { CreateQuizModal } from '@/features/quizzes/components/CreateQuizModal';
import { getInstructorCourseOptions, getInstructorQuizzes } from '@/features/quizzes/server/data';
import { requireRole } from '@/lib/auth/session';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <HelpCircle className="size-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No quizzes created yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Click &quot;Create Quiz&quot; above to build an interactive quiz for any of your courses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((q) => (
            <Card key={q.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{q.courseTitle}</span>
                  <Badge variant="outline">{q.sectionTitle}</Badge>
                </div>
                <CardTitle className="text-lg font-medium">{q.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between space-y-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">{q.questionCount}</span> Questions
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{q.passingScore}%</span> Pass score
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{q.attemptCount}</span> Attempts
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">
                      {q.timeLimitSec ? `${Math.round(q.timeLimitSec / 60)} min` : 'No limit'}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href={`/instructor/courses/${q.courseId}`}>Edit in course</Link>}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
