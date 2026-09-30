import { CreditCard } from 'lucide-react';
import Link from 'next/link';

import { getCollectedCents, getPayments } from '@/features/enrollment/server/data';
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from '@/features/enrollment/schemas';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { StatusPill, type StatusTone } from '@/shared/components/dashboard/StatusPill';
import { ROLES } from '@/shared/constants/roles';
import { formatMoney } from '@/shared/utils/money';

const STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  PAID: 'success',
  PARTIAL: 'warning',
  PENDING: 'neutral',
  REFUNDED: 'danger',
};

export default async function AdminPaymentsPage() {
  await requireRole(ROLES.ADMIN);
  const [payments, collectedCents] = await Promise.all([getPayments(), getCollectedCents()]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<CreditCard />}
        title="Payments"
        description={`${payments.length} record${payments.length === 1 ? '' : 's'} · ${formatMoney(collectedCents)} collected. Recorded manually per enrollment.`}
      />

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No payments recorded yet. Record them from an{' '}
          <Link href="/admin/enrollments" className="underline underline-offset-4">
            enrollment
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/enrollments/${p.enrollment.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {formatMoney(p.amountCents, p.currency)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={STATUS_TONE[p.status as PaymentStatus]}>
                      {PAYMENT_STATUS_LABELS[p.status as PaymentStatus]}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">{p.enrollment.student.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.enrollment.course.title}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.recordedBy.name} · {p.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
