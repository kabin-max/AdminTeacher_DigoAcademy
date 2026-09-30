'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  advanceInquiry,
  convertInquiryToEnrollment,
  declineInquiry,
} from '@/features/enrollment/server/actions';
import {
  INQUIRY_STATUS_LABELS,
  canConvert,
  isOpen,
  nextStage,
  type InquiryStatus,
} from '@/features/enrollment/pipeline';
import { ENROLLMENT_MODE_LABELS, type EnrollmentMode } from '@/features/enrollment/schemas';
import { StatusPill, type StatusTone } from '@/shared/components/dashboard/StatusPill';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface CohortOption {
  id: string;
  name: string;
}

export interface InquiryRow {
  id: string;
  status: InquiryStatus;
  mode: EnrollmentMode;
  message: string | null;
  createdAt: string;
  contact: { name: string; email: string; phone?: string | null; isGuest: boolean };
  course: { id: string; title: string };
  batches: CohortOption[];
  learningPlans: CohortOption[];
  enrolled: boolean;
}

const STATUS_TONE: Record<InquiryStatus, StatusTone> = {
  NEW: 'info',
  CONTACTED: 'warning',
  CONFIRMED: 'brand',
  ENROLLED: 'success',
  DECLINED: 'danger',
};

const selectClass =
  'h-8 rounded-lg border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50';

export function InquiriesTable({ inquiries }: { inquiries: InquiryRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cohortChoice, setCohortChoice] = useState<Record<string, string>>({});

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? 'Something went wrong.');
        return;
      }
      toast.success(success);
      router.refresh();
    });

  function convert(row: InquiryRow) {
    const cohortId = cohortChoice[row.id] ?? '';
    if (!cohortId) {
      toast.error(
        row.mode === 'GROUP_LIVE' ? 'Pick a batch first.' : 'Pick a learning plan first.'
      );
      return;
    }
    run(
      () =>
        convertInquiryToEnrollment({
          inquiryId: row.id,
          batchId: row.mode === 'GROUP_LIVE' ? cohortId : '',
          learningPlanId: row.mode === 'SELF_PACED' ? cohortId : '',
        }),
      'Student enrolled.'
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="px-4 py-3 font-medium">Course</th>
            <th className="px-4 py-3 font-medium">Mode</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Pipeline</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {inquiries.map((row) => {
            const next = nextStage(row.status);
            const cohorts = row.mode === 'GROUP_LIVE' ? row.batches : row.learningPlans;
            return (
              <tr
                key={row.id}
                className={cn('transition-colors hover:bg-muted/30', !isOpen(row.status) && 'opacity-70')}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{row.contact.name}</span>
                    {row.contact.isGuest && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                        Guest
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{row.contact.email}</div>
                  {row.contact.phone && (
                    <div className="text-xs text-muted-foreground">{row.contact.phone}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/courses/${row.course.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.course.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{ENROLLMENT_MODE_LABELS[row.mode]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={STATUS_TONE[row.status]}>
                    {INQUIRY_STATUS_LABELS[row.status]}
                  </StatusPill>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {canConvert(row.status) && (
                      <>
                        <select
                          className={selectClass}
                          value={cohortChoice[row.id] ?? ''}
                          disabled={isPending || cohorts.length === 0}
                          onChange={(e) =>
                            setCohortChoice((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          aria-label={row.mode === 'GROUP_LIVE' ? 'Batch' : 'Learning plan'}
                        >
                          <option value="">
                            {cohorts.length === 0
                              ? row.mode === 'GROUP_LIVE'
                                ? 'No batches — create one'
                                : 'No plans — create one'
                              : row.mode === 'GROUP_LIVE'
                                ? 'Choose batch…'
                                : 'Choose plan…'}
                          </option>
                          {cohorts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={isPending || cohorts.length === 0}
                          onClick={() => convert(row)}
                        >
                          Enroll
                        </Button>
                      </>
                    )}
                    {next && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          run(() => advanceInquiry(row.id), `Marked ${INQUIRY_STATUS_LABELS[next]}.`)
                        }
                      >
                        Mark {INQUIRY_STATUS_LABELS[next]}
                      </Button>
                    )}
                    {isOpen(row.status) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => run(() => declineInquiry(row.id), 'Inquiry declined.')}
                      >
                        Decline
                      </Button>
                    )}
                    {row.enrolled && (
                      <span className="text-xs text-muted-foreground">Enrolled</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
