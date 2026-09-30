'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { availableTransitions, type CourseStatus } from '@/features/courses/lifecycle';
import { cloneCourse, transitionCourse } from '@/features/courses/server/actions';
import { Button } from '@/shared/components/ui/button';

export function InstructorCourseActions({
  courseId,
  status,
}: {
  courseId: string;
  status: CourseStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const transitions = availableTransitions(status, 'INSTRUCTOR', true);

  async function run(fn: () => Promise<{ ok: boolean; error?: string; courseId?: string }>, redirectToClone = false) {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Action failed');
      return;
    }
    if (redirectToClone && result.courseId) {
      toast.success('Course cloned.');
      router.push(`/instructor/courses/${result.courseId}`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((t) => (
        <Button
          key={t.action}
          size="sm"
          disabled={busy}
          onClick={() => run(() => transitionCourse(courseId, t.action))}
        >
          {t.label}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => run(() => cloneCourse(courseId), true)}
      >
        Duplicate
      </Button>
    </div>
  );
}
