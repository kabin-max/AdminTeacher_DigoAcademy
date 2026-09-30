'use client';

import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { updateBatchScheduleSchema } from '@/features/cohorts/schemas';
import { updateBatchSchedule } from '@/features/cohorts/server/actions';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

interface FormValues {
  startDate: string;
  endDate: string;
}

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Instructor-facing: manage a batch's weekly class schedule + Meet link only. */
export function BatchScheduleForm({
  batchId,
  startDate,
  endDate,
  meetLink,
}: {
  batchId: string;
  startDate: string | null;
  endDate: string | null;
  meetLink: string | null;
}) {
  const router = useRouter();
  const [isSaving, startSave] = useTransition();
  const [values, setValues] = useState<FormValues>({
    startDate: toDateTimeLocal(startDate),
    endDate: toDateInput(endDate),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  function save() {
    const parsed = updateBatchScheduleSchema.safeParse({ id: batchId, ...values });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setErrors(issue ? { [issue.path[0] as keyof FormValues]: issue.message } : {});
      return;
    }
    setErrors({});
    startSave(async () => {
      const result = await updateBatchSchedule({ id: batchId, ...values });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not save changes.');
        return;
      }
      toast.success('Class schedule saved.');
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field data-invalid={!!errors.startDate}>
        <FieldLabel>First class date &amp; time</FieldLabel>
        <Input
          type="datetime-local"
          value={values.startDate}
          onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
          aria-invalid={!!errors.startDate}
        />
        <p className="text-xs text-muted-foreground">
          Sets the weekly class day/time — the Meet link repeats at this slot every week.
        </p>
        <FieldError>{errors.startDate}</FieldError>
      </Field>
      <Field data-invalid={!!errors.endDate}>
        <FieldLabel>Class end date</FieldLabel>
        <Input
          type="date"
          value={values.endDate}
          onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
          aria-invalid={!!errors.endDate}
        />
        <FieldError>{errors.endDate}</FieldError>
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel>Meet link</FieldLabel>
        <div className="flex items-center gap-2">
          <Input value={meetLink ?? 'Not created yet — set a start date and save.'} readOnly disabled={!meetLink} />
          {meetLink && (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: 'icon', variant: 'outline' }))}
              aria-label="Open Meet link in a new tab"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </Field>

      <div className="sm:col-span-2">
        <Button type="button" onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
