'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  course: z.string().min(1, 'Please select a course or track of interest'),
  message: z.string().min(10, 'Please enter a message (at least 10 characters)'),
  _gotcha: z.string().max(0, 'Spam detected').optional(), // honeypot
});

type ContactInput = z.infer<typeof contactSchema>;

// import { sendContactMessage } from '@/app/(public)/contact/actions';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      course: 'aws-cloud-practitioner',
      message: '',
      _gotcha: '',
    },
  });

  async function onSubmit(data: ContactInput) {
    if (data._gotcha) {
      return; // silent discard spam
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value as string);
    });

    const result = { success: true, error: null }; // Mocked

    if (result.success) {
      setSubmitted(true);
      toast.success('Message sent! An advisor will reach out within 24 hours.');
      reset();
    } else {
      toast.error(result.error || 'Failed to send message.');
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="mt-4 font-heading text-xl font-bold text-foreground">Message Received!</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Thank you for reaching out. An academic counselor will review your goals and reply via email and WhatsApp shortly.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Honeypot field - invisible to humans */}
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register('_gotcha')} />

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="contact-name">Full Name</FieldLabel>
            <Input id="contact-name" placeholder="Kaka" {...register('name')} />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="contact-email">Email Address</FieldLabel>
            <Input id="contact-email" type="email" placeholder="kaka@example.com" {...register('email')} />
            <FieldError errors={[errors.email]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="contact-phone">Phone / WhatsApp Number</FieldLabel>
            <Input id="contact-phone" type="tel" placeholder="+977 9800000000" {...register('phone')} />
            <FieldError errors={[errors.phone]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="contact-course">Interested Track</FieldLabel>
            <select
              id="contact-course"
              {...register('course')}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="aws-cloud-practitioner">AWS Cloud Practitioner</option>
              <option value="aws-ai-practitioner">AWS AI Practitioner</option>
              <option value="aws-developer">AWS Developer - Associate</option>
              <option value="aws-solutions-architect">AWS Solutions Architect - Associate</option>
              <option value="aws-cloudops-architect">AWS CloudOps Architect - Associate</option>
              <option value="aws-devops-engineer">AWS DevOps Engineer - Professional</option>
            </select>
            <FieldError errors={[errors.course]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="contact-message">How can we help you?</FieldLabel>
          <Textarea
            id="contact-message"
            rows={4}
            placeholder="Tell us about your background, questions, or the target timeline you have in mind..."
            {...register('message')}
          />
          <FieldError errors={[errors.message]} />
        </Field>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full gap-2 rounded-full px-7 py-2.5 shadow-sm bg-linear-to-r from-brand-blue to-[#00b4d8] text-white hover:opacity-95 uppercase tracking-wider text-xs font-bold">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending message...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Send Message
            </>
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
