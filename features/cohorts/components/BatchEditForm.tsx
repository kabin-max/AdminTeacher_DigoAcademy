'use client';

import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { updateBatchSchema } from '@/features/cohorts/schemas';
import { updateBatch } from '@/features/cohorts/server/actions';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';
import { firstFieldErrors } from '@/shared/utils/zod-errors';

interface Choice {
  id: string;
  name: string;
}

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20';

interface FormValues {
  name: string;
  courseId: string;
  instructorId: string;
  startDate: string;
  endDate: string;
  capacity: string;
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

export function BatchEditForm({
  batchId,
  initial,
  meetLink,
  courses,
  instructors,
}: {
  batchId: string;
  initial: {
    name: string;
    courseId: string;
    instructorId: string | null;
    startDate: string | null;
    endDate: string | null;
    capacity: number | null;
  };
  meetLink: string | null;
  courses: Choice[];
  instructors: Choice[];
}) {
  const router = useRouter();
  const [isSaving, startSave] = useTransition();
  const [values, setValues] = useState<FormValues>({
    name: initial.name,
    courseId: initial.courseId,
    instructorId: initial.instructorId ?? '',
    startDate: toDateTimeLocal(initial.startDate),
    endDate: toDateInput(initial.endDate),
    capacity: initial.capacity != null ? String(initial.capacity) : '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const set = (patch: Partial<FormValues>) => setValues((v) => ({ ...v, ...patch }));

  function save() {
    const parsed = updateBatchSchema.safeParse({ id: batchId, ...values });
    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setErrors({});
    startSave(async () => {
      const result = await updateBatch({ id: batchId, ...values });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not save changes.');
        return;
      }
      toast.success('Changes saved.');
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field data-invalid={!!errors.name}>
        <FieldLabel>Name</FieldLabel>
        <Input value={values.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={!!errors.name} />
        <FieldError>{errors.name}</FieldError>
      </Field>
      <Field data-invalid={!!errors.endDate}>
        <FieldLabel>Class end date</FieldLabel>
        <Input
          type="date"
          value={values.endDate}
          onChange={(e) => set({ endDate: e.target.value })}
          aria-invalid={!!errors.endDate}
        />
        <FieldError>{errors.endDate}</FieldError>
      </Field>
      <Field data-invalid={!!errors.courseId}>
        <FieldLabel>Course</FieldLabel>
        <select
          className={selectClass}
          value={values.courseId}
          onChange={(e) => set({ courseId: e.target.value })}
          aria-invalid={!!errors.courseId}
        >
          <option value="">Choose course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError>{errors.courseId}</FieldError>
      </Field>
      <Field>
        <FieldLabel>Instructor</FieldLabel>
        <select
          className={selectClass}
          value={values.instructorId}
          onChange={(e) => set({ instructorId: e.target.value })}
        >
          <option value="">Unassigned</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </Field>
      <Field data-invalid={!!errors.startDate}>
        <FieldLabel>First class date &amp; time</FieldLabel>
        <Input
          type="datetime-local"
          value={values.startDate}
          onChange={(e) => set({ startDate: e.target.value })}
          aria-invalid={!!errors.startDate}
        />
        <p className="text-xs text-muted-foreground">
          Sets the weekly class day/time — the Meet link repeats at this slot every week.
        </p>
        <FieldError>{errors.startDate}</FieldError>
      </Field>
      <Field>
        <FieldLabel>Capacity</FieldLabel>
        <Input
          type="number"
          min={1}
          value={values.capacity}
          onChange={(e) => set({ capacity: e.target.value })}
          placeholder="Optional"
        />
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

      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="button" onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/batches')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
