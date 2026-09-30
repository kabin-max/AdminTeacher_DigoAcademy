'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { createBatch, deleteBatch } from '@/features/cohorts/server/actions';
import { createBatchSchema } from '@/features/cohorts/schemas';
import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { useConfirm } from '@/shared/hooks/use-confirm';
import { cn } from '@/shared/utils/cn';
import { firstFieldErrors } from '@/shared/utils/zod-errors';

export interface BatchRow {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  instructorId: string | null;
  instructorName: string | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  meetLink: string | null;
  enrollmentCount: number;
  liveClassCount: number;
}

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

const emptyForm: FormValues = {
  name: '',
  courseId: '',
  instructorId: '',
  startDate: '',
  endDate: '',
  capacity: '',
};

function BatchForm({
  courses,
  instructors,
  values,
  onChange,
  onSubmit,
  submitLabel,
  pending,
  errors = {},
}: {
  courses: Choice[];
  instructors: Choice[];
  values: FormValues;
  onChange: (values: FormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  errors?: Partial<Record<keyof FormValues, string>>;
}) {
  const set = (patch: Partial<FormValues>) => onChange({ ...values, ...patch });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field data-invalid={!!errors.name}>
        <FieldLabel>Name</FieldLabel>
        <Input
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Spring 2026 Cohort"
          aria-invalid={!!errors.name}
        />
        <FieldError>{errors.name}</FieldError>
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
      <Field>
        <FieldLabel>First class date &amp; time</FieldLabel>
        <Input
          type="datetime-local"
          value={values.startDate}
          onChange={(e) => set({ startDate: e.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel>Class end date</FieldLabel>
        <Input
          type="date"
          value={values.endDate}
          onChange={(e) => set({ endDate: e.target.value })}
        />
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
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="button" onClick={onSubmit} disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function BatchManager({
  batches,
  courses,
  instructors,
}: {
  batches: BatchRow[];
  courses: Choice[];
  instructors: Choice[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isCreating, startCreate] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [createValues, setCreateValues] = useState<FormValues>(emptyForm);
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  function add() {
    const parsed = createBatchSchema.safeParse(createValues);
    if (!parsed.success) {
      setCreateErrors(firstFieldErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setCreateErrors({});
    startCreate(async () => {
      const result = await createBatch(createValues);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not create batch.');
        return;
      }
      toast.success(`Batch "${createValues.name}" created.`);
      setCreateValues(emptyForm);
      router.refresh();
    });
  }

  async function remove(row: BatchRow) {
    const ok = await confirm({
      title: `Delete batch "${row.name}"?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(row.id);
    startDelete(async () => {
      const result = await deleteBatch(row.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete batch.');
        setDeletingId(null);
        return;
      }
      toast.success(`Batch "${row.name}" deleted.`);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Add a batch</h2>
        <BatchForm
          courses={courses}
          instructors={instructors}
          values={createValues}
          onChange={(v) => {
            setCreateValues(v);
            setCreateErrors({});
          }}
          onSubmit={add}
          submitLabel="Add batch"
          pending={isCreating}
          errors={createErrors}
        />
      </div>

      {batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No batches yet.</p>
      ) : (
        <ul className="space-y-2">
          {batches.map((row) => {
            const rowDeleting = isDeleting && deletingId === row.id;
            return (
              <li key={row.id} className="rounded-lg border">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.name}</span>
                      {row.enrollmentCount > 0 && (
                        <Badge variant="secondary">{row.enrollmentCount} enrolled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row.courseTitle} · {row.instructorName ?? 'No instructor'}
                      {row.capacity != null && ` · cap ${row.capacity}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {row.meetLink && (
                      <a
                        href={row.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                      >
                        Join
                      </a>
                    )}
                    <Link
                      href={`/admin/batches/${row.id}`}
                      className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}
                    >
                      Edit
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(row)}
                      disabled={rowDeleting}
                    >
                      {rowDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
