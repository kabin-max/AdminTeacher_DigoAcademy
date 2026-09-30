'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import PhoneInput, { type Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { toast } from 'sonner';

import {
  ENROLLMENT_MODES,
  ENROLLMENT_MODE_LABELS,
  createGuestInquirySchema,
  type CreateGuestInquiryInput,
} from '@/features/enrollment/schemas';
import { createGuestInquiry } from '@/features/enrollment/server/actions';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';

const MODE_HINTS: Record<(typeof ENROLLMENT_MODES)[number], string> = {
  GROUP_LIVE: 'Scheduled live sessions with an instructor and a cohort.',
  SELF_PACED: 'Recorded lessons and materials you work through anytime.',
};

// Style react-phone-number-input to match the app's <Input>: a bordered box
// wrapping the country flag/select and a borderless number field.
const phoneInputClass = cn(
  'flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors',
  'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:text-sm',
  '[&_.PhoneInputInput]:h-full [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-base [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted-foreground md:[&_.PhoneInputInput]:text-sm'
);
const phoneInputInvalid = 'border-destructive ring-3 ring-destructive/20';

/**
 * Public (guest) booking form. Captures contact details and submits an inquiry
 * without requiring an account — the admin creates the student account on
 * enrollment. Shows a confirmation state on success.
 */
export function GuestInquiryForm({ courseId }: { courseId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const reduceMotion = useReducedMotion();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGuestInquiryInput>({
    resolver: zodResolver(createGuestInquirySchema),
    defaultValues: { courseId, mode: 'GROUP_LIVE', name: '', email: '', phone: '', message: '' },
  });

  async function onSubmit(values: CreateGuestInquiryInput) {
    const result = await createGuestInquiry(values);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not submit your inquiry.');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400"
      >
        <motion.span
          initial={reduceMotion ? false : { scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        </motion.span>
        <div>
          <p className="font-medium">Request received!</p>
          <p className="mt-0.5">
            Thanks for your interest — our team will reach out by email shortly to help you enroll.
          </p>
        </div>
      </motion.div>
    );
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
        <FieldLabel htmlFor="name">Full name</FieldLabel>
        <Input id="name" autoComplete="name" {...register('name')} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              id="phone"
              international
              defaultCountry="NP"
              autoComplete="tel"
              placeholder="Enter phone number"
              value={(field.value ?? '') as Value}
              onChange={(value) => field.onChange(value ?? '')}
              onBlur={field.onBlur}
              className={cn(phoneInputClass, errors.phone && phoneInputInvalid)}
            />
          )}
        />
        <FieldError errors={[errors.phone]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="message">Message (optional)</FieldLabel>
        <Textarea
          id="message"
          rows={3}
          placeholder="Questions about schedule, prerequisites, pricing…"
          {...register('message')}
        />
        <FieldError errors={[errors.message]} />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {isSubmitting ? 'Sending…' : 'Request enrollment'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No payment now — we&apos;ll contact you to complete enrollment.
      </p>
    </form>
  );
}
