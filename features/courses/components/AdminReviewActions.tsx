'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { availableTransitions, type CourseStatus } from '@/features/courses/lifecycle';
import { clearReReviewFlag, transitionCourse } from '@/features/courses/server/actions';
import { Button } from '@/shared/components/ui/button';

export function AdminReviewActions({
  courseId,
  status,
  reReviewFlagged,
}: {
  courseId: string;
  status: CourseStatus;
  reReviewFlagged: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const transitions = availableTransitions(status, 'ADMIN', false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Action failed');
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
          variant={t.action === 'reject' || t.action === 'suspend' ? 'outline' : 'default'}
          disabled={busy}
          onClick={() => run(() => transitionCourse(courseId, t.action))}
        >
          {t.label}
        </Button>
      ))}
      {reReviewFlagged && status === 'PUBLISHED' && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => clearReReviewFlag(courseId))}>
          Clear re-review
        </Button>
      )}
    </div>
  );
}
