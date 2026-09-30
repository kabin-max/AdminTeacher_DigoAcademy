'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { removeEnrollment } from '@/features/enrollment/server/actions';
import { Button } from '@/shared/components/ui/button';
import { useConfirm } from '@/shared/hooks/use-confirm';

export function RemoveEnrollmentButton({
  enrollmentId,
  studentName,
}: {
  enrollmentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();

  async function remove() {
    const ok = await confirm({
      title: `Remove ${studentName}'s enrollment?`,
      description: 'This also deletes its payment records. This cannot be undone.',
      confirmLabel: 'Remove enrollment',
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await removeEnrollment(enrollmentId);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not remove enrollment.');
        return;
      }
      toast.success(`${studentName}'s enrollment removed.`);
      router.push('/admin/enrollments');
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={remove}>
      Remove enrollment
    </Button>
  );
}
