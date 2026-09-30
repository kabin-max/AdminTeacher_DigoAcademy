'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  createLearningPlan,
  deleteLearningPlan,
  updateLearningPlan,
} from '@/features/cohorts/server/actions';
import { createLearningPlanSchema } from '@/features/cohorts/schemas';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { useConfirm } from '@/shared/hooks/use-confirm';
import { firstFieldErrors } from '@/shared/utils/zod-errors';

export interface LearningPlanRow {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  description: string | null;
  enrollmentCount: number;
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
  description: string;
}

const emptyForm: FormValues = { name: '', courseId: '', description: '' };

function PlanForm({
  courses,
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  pending,
  errors = {},
}: {
  courses: Choice[];
  values: FormValues;
  onChange: (values: FormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  pending: boolean;
  errors?: Partial<Record<keyof FormValues, string>>;
}) {
  const set = (patch: Partial<FormValues>) => onChange({ ...values, ...patch });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field data-invalid={!!errors.name}>
        <FieldLabel>Name</FieldLabel>
        <Input
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Self-paced track"
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
      <Field className="sm:col-span-2">
        <FieldLabel>Description</FieldLabel>
        <Textarea
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional summary of this plan."
        />
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="button" onClick={onSubmit} disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export function LearningPlanManager({
  plans,
  courses,
}: {
  plans: LearningPlanRow[];
  courses: Choice[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  // Separate pending flags per action — one shared `useTransition` made the
  // idle "Add a plan" card flash into "Saving…" on every edit/delete, looking
  // like it had re-triggered.
  const [isCreating, startCreate] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [createValues, setCreateValues] = useState<FormValues>(emptyForm);
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<FormValues>(emptyForm);
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  function add() {
    const parsed = createLearningPlanSchema.safeParse(createValues);
    if (!parsed.success) {
      setCreateErrors(firstFieldErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setCreateErrors({});
    startCreate(async () => {
      const result = await createLearningPlan(createValues);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not create plan.');
        return;
      }
      toast.success(`Learning plan "${createValues.name}" created.`);
      setCreateValues(emptyForm);
      router.refresh();
    });
  }

  function startEdit(row: LearningPlanRow) {
    setEditingId(row.id);
    setEditErrors({});
    setEditValues({
      name: row.name,
      courseId: row.courseId,
      description: row.description ?? '',
    });
  }

  function saveEdit(id: string) {
    const parsed = createLearningPlanSchema.safeParse(editValues);
    if (!parsed.success) {
      setEditErrors(firstFieldErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setEditErrors({});
    startSave(async () => {
      const result = await updateLearningPlan({ id, ...editValues });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not update plan.');
        return;
      }
      toast.success(`Learning plan "${editValues.name}" updated.`);
      setEditingId(null);
      router.refresh();
    });
  }

  async function remove(row: LearningPlanRow) {
    const ok = await confirm({
      title: `Delete learning plan "${row.name}"?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(row.id);
    startDelete(async () => {
      const result = await deleteLearningPlan(row.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete plan.');
        setDeletingId(null);
        return;
      }
      toast.success(`Learning plan "${row.name}" deleted.`);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Add a learning plan</h2>
        <PlanForm
          courses={courses}
          values={createValues}
          onChange={(v) => {
            setCreateValues(v);
            setCreateErrors({});
          }}
          onSubmit={add}
          submitLabel="Add plan"
          pending={isCreating}
          errors={createErrors}
        />
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No learning plans yet.</p>
      ) : (
        <ul className="space-y-2">
          {plans.map((row) => {
            const rowDeleting = isDeleting && deletingId === row.id;
            return (
            <li key={row.id} className="rounded-lg border">
              {editingId === row.id ? (
                <div className="p-4">
                  <PlanForm
                    courses={courses}
                    values={editValues}
                    onChange={(v) => {
                      setEditValues(v);
                      setEditErrors({});
                    }}
                    onSubmit={() => saveEdit(row.id)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Save"
                    pending={isSaving}
                    errors={editErrors}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.name}</span>
                      {row.enrollmentCount > 0 && (
                        <Badge variant="secondary">{row.enrollmentCount} enrolled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row.courseTitle}
                      {row.description ? ` · ${row.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(row)}
                      disabled={rowDeleting}
                    >
                      Edit
                    </Button>
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
              )}
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
