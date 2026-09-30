'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deletePayment, recordPayment } from '@/features/enrollment/server/actions';
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
} from '@/features/enrollment/schemas';
import { StatusPill, type StatusTone } from '@/shared/components/dashboard/StatusPill';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { useConfirm } from '@/shared/hooks/use-confirm';
import { formatMoney } from '@/shared/utils/money';
import { cn } from '@/shared/utils/cn';

export interface PaymentRow {
  id: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  reference: string | null;
  note: string | null;
  createdAt: string;
  recordedBy: string;
}

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  PAID: 'success',
  PARTIAL: 'warning',
  PENDING: 'neutral',
  REFUNDED: 'danger',
};

export function EnrollmentPayments({
  enrollmentId,
  currency,
  payments,
}: {
  enrollmentId: string;
  currency: string;
  payments: PaymentRow[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('PAID');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');

  function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    startTransition(async () => {
      const result = await recordPayment({
        enrollmentId,
        amount: value,
        currency,
        status,
        method: method.trim() || undefined,
        reference: reference.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not record payment.');
        return;
      }
      toast.success(`Payment of ${formatMoney(Math.round(value * 100), currency)} recorded.`);
      setAmount('');
      setMethod('');
      setReference('');
      setStatus('PAID');
      router.refresh();
    });
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: 'Delete this payment record?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deletePayment(id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete payment.');
        return;
      }
      toast.success('Payment record deleted.');
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium">Record a payment</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field>
            <FieldLabel htmlFor="pay-amount">Amount ({currency})</FieldLabel>
            <Input
              id="pay-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="pay-status">Status</FieldLabel>
            <select
              id="pay-status"
              className={selectClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="pay-method">Method</FieldLabel>
            <Input
              id="pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Cash, bank transfer…"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="pay-ref">Reference</FieldLabel>
            <Input
              id="pay-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Receipt / txn no."
            />
          </Field>
        </div>
        <div className="mt-3">
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? 'Saving…' : 'Record payment'}
          </Button>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatMoney(p.amountCents, p.currency)}</span>
                  <StatusPill tone={STATUS_TONE[p.status]}>
                    {PAYMENT_STATUS_LABELS[p.status]}
                  </StatusPill>
                </div>
                <p className="text-xs text-muted-foreground">
                  {[p.method, p.reference].filter(Boolean).join(' · ') || '—'} · recorded by{' '}
                  {p.recordedBy} · {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className={cn('text-destructive')}
                disabled={isPending}
                onClick={() => remove(p.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
