'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { deleteReview } from '@/features/reviews/server/actions';
import { Button } from '@/shared/components/ui/button';
import { useConfirm } from '@/shared/hooks/use-confirm';

export interface ReviewRow {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
}

function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, rating));
  return (
    <span className="text-sm" aria-label={`${clamped} out of 5`}>
      <span className="text-amber-500">{'★'.repeat(clamped)}</span>
      <span className="text-muted-foreground">{'★'.repeat(5 - clamped)}</span>
    </span>
  );
}

export function ReviewsTable({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();

  async function remove(row: ReviewRow) {
    const ok = await confirm({
      title: `Delete ${row.studentName}'s review?`,
      description: `Their review of "${row.courseTitle}" will be permanently removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteReview(row.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete review.');
        return;
      }
      toast.success(`Review removed from "${row.courseTitle}".`);
      router.refresh();
    });
  }

  return (
    <ul className="divide-y rounded-2xl bg-card shadow-sm">
      {reviews.map((row) => (
        <li
          key={row.id}
          className="flex items-start justify-between gap-4 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted/30"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Stars rating={row.rating} />
              <span className="text-sm font-medium">{row.studentName}</span>
              <span className="text-xs text-muted-foreground">
                on{' '}
                <Link
                  href={`/admin/courses/${row.courseId}`}
                  className="underline-offset-4 hover:underline"
                >
                  {row.courseTitle}
                </Link>{' '}
                · {row.instructorName} · {new Date(row.createdAt).toLocaleDateString()}
              </span>
            </div>
            {row.text && <p className="text-sm text-muted-foreground">{row.text}</p>}
          </div>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => remove(row)}
          >
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
