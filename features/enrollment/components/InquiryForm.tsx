'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  ENROLLMENT_MODES,
  ENROLLMENT_MODE_LABELS,
  createInquirySchema,
  type CreateInquiryInput,
} from '@/features/enrollment/schemas';
import { createInquiry } from '@/features/enrollment/server/actions';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';

const MODE_HINTS: Record<(typeof ENROLLMENT_MODES)[number], string> = {
  GROUP_LIVE: 'Scheduled live sessions with an instructor and a cohort.',
  SELF_PACED: 'Recorded lessons and materials you work through anytime.',
};

/**
 * Student-facing booking form. Submits a manual-pipeline inquiry the admin then
 * follows up on. `courseId` is fixed to the course being viewed.
 */
export function InquiryForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateInquiryInput>({
    resolver: zodResolver(createInquirySchema),
    defaultValues: { courseId, mode: 'GROUP_LIVE', message: '' },
  });

  async function onSubmit(values: CreateInquiryInput) {
    const result = await createInquiry(values);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not submit your inquiry.');
      return;
    }
    toast.success('Inquiry sent — our team will reach out to you soon.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <input type="hidden" {...register('courseId')} />

      <Field>
        <FieldLabel>How would you like to learn?</FieldLabel>
        <Controller
          control={control}
          name="mode"
          render={({ field }) => (
            <div className="grid gap-2 sm:grid-cols-2">
              {ENROLLMENT_MODES.map((mode) => {
                const selected = field.value === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => field.onChange(mode)}
                    aria-pressed={selected}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:bg-muted/50'
                    )}
                  >
                    <span className="block text-sm font-medium">
                      {ENROLLMENT_MODE_LABELS[mode]}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {MODE_HINTS[mode]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        <FieldError errors={[errors.mode]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="message">Anything you&apos;d like us to know? (optional)</FieldLabel>
        <Textarea
          id="message"
          rows={3}
          placeholder="Questions about schedule, prerequisites, pricing…"
          {...register('message')}
        />
        <FieldError errors={[errors.message]} />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Request enrollment'}
      </Button>
    </form>
  );
}
