'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { deleteCourse } from '@/features/courses/server/actions';
import { Button } from '@/shared/components/ui/button';
import { useConfirm } from '@/shared/hooks/use-confirm';

export function DeleteCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();

  async function remove() {
    const ok = await confirm({
      title: `Delete "${courseTitle}"?`,
      description: 'This permanently removes the course and its curriculum. This cannot be undone.',
      confirmLabel: 'Delete course',
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteCourse(courseId);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete course.');
        return;
      }
      toast.success(`"${courseTitle}" deleted.`);
      router.push('/admin/courses');
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={remove}>
      <Trash2 />
      Delete
    </Button>
  );
}
