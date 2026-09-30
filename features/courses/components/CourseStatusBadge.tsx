import { StatusPill, type StatusTone } from '@/shared/components/dashboard/StatusPill';

const TONE: Record<string, StatusTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  PUBLISHED: 'success',
  UNPUBLISHED: 'info',
  SUSPENDED: 'danger',
};

const LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'In review',
  PUBLISHED: 'Published',
  UNPUBLISHED: 'Unpublished',
  SUSPENDED: 'Suspended',
};

export function CourseStatusBadge({
  status,
  reReviewFlagged,
}: {
  status: string;
  reReviewFlagged?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <StatusPill tone={TONE[status] ?? 'neutral'}>{LABEL[status] ?? status}</StatusPill>
      {reReviewFlagged && <StatusPill tone="warning">Re-review</StatusPill>}
    </span>
  );
}
