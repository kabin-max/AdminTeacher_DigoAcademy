import { BadgeDollarSign, TrendingUp, Wallet } from 'lucide-react';
import { notFound } from 'next/navigation';

import {
  EnrollmentPayments,
  type PaymentRow,
} from '@/features/enrollment/components/EnrollmentPayments';
import { RemoveEnrollmentButton } from '@/features/enrollment/components/RemoveEnrollmentButton';
import { getEnrollmentDetail } from '@/features/enrollment/server/data';
import {
  ENROLLMENT_MODE_LABELS,
  type EnrollmentMode,
  type PaymentStatus,
} from '@/features/enrollment/schemas';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Panel } from '@/shared/components/dashboard/Panel';
import { StatusPill } from '@/shared/components/dashboard/StatusPill';
import { WidgetCard } from '@/shared/components/dashboard/WidgetCard';
import { ROLES } from '@/shared/constants/roles';
import { formatMoney } from '@/shared/utils/money';

export default async function AdminEnrollmentDetailPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  await requireRole(ROLES.ADMIN);
  const { enrollmentId } = await params;

  const enrollment = await getEnrollmentDetail(enrollmentId);
  if (!enrollment) notFound();

  const currency = enrollment.course.currency;
  const paidCents = enrollment.payments
    .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
    .reduce((sum, p) => sum + p.amountCents, 0);

  const paymentRows: PaymentRow[] = enrollment.payments.map((p) => ({
    id: p.id,
    amountCents: p.amountCents,
    currency: p.currency,
    status: p.status as PaymentStatus,
    method: p.method,
    reference: p.reference,
    note: p.note,
    createdAt: p.createdAt.toISOString(),
    recordedBy: p.recordedBy.name,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Enrollments', href: '/admin/enrollments' },
        ]}
        title={enrollment.student.name}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span>{enrollment.course.title}</span>
            <StatusPill tone="info">
              {ENROLLMENT_MODE_LABELS[enrollment.mode as EnrollmentMode]}
            </StatusPill>
            <span className="text-xs">
              {enrollment.batch
                ? `Batch: ${enrollment.batch.name}`
                : enrollment.learningPlan
                  ? `Plan: ${enrollment.learningPlan.name}`
                  : 'No cohort'}
            </span>
          </div>
        }
        action={
          <RemoveEnrollmentButton
            enrollmentId={enrollment.id}
            studentName={enrollment.student.name}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <WidgetCard
          title="Course price"
          value={formatMoney(enrollment.course.priceCents, currency)}
          icon={<BadgeDollarSign />}
          accent="blue"
        />
        <WidgetCard
          title="Collected"
          value={formatMoney(paidCents, currency)}
          icon={<Wallet />}
          accent="emerald"
        />
        <WidgetCard
          title="Progress"
          value={`${enrollment.progressPct}%`}
          icon={<TrendingUp />}
          accent="violet"
        />
      </div>

      <Panel>
        <h2 className="font-heading text-base font-semibold">Payments</h2>
        <div className="mt-4">
          <EnrollmentPayments
            enrollmentId={enrollment.id}
            currency={currency}
            payments={paymentRows}
          />
        </div>
      </Panel>
    </div>
  );
}
