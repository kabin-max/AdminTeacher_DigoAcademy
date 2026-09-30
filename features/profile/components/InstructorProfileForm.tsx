'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateInstructorProfile } from '@/features/profile/server/actions';
import { instructorProfileSchema, type InstructorProfileInput } from '@/features/profile/schemas';
import type { InstructorProfileView } from '@/features/profile/types';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

export function InstructorProfileForm({ profile }: { profile: InstructorProfileView }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<InstructorProfileInput>({
    resolver: zodResolver(instructorProfileSchema),
    defaultValues: {
      name: profile.name,
      headline: profile.headline,
      experience: profile.experience,
      portfolioUrl: profile.portfolioUrl,
      twitter: profile.social.twitter ?? '',
      linkedin: profile.social.linkedin ?? '',
      website: profile.social.website ?? '',
    },
  });

  async function onSubmit(values: InstructorProfileInput) {
    const result = await updateInstructorProfile(values);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not save profile');
      return;
    }
    toast.success('Profile saved.');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" {...register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="headline">Headline</FieldLabel>
          <Input id="headline" placeholder="Senior Frontend Engineer & Educator" {...register('headline')} />
          <FieldError errors={[errors.headline]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="experience">Experience</FieldLabel>
          <Textarea id="experience" rows={5} {...register('experience')} />
          <FieldDescription>Your background and teaching experience.</FieldDescription>
          <FieldError errors={[errors.experience]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="portfolioUrl">Portfolio URL</FieldLabel>
          <Input id="portfolioUrl" placeholder="https://…" {...register('portfolioUrl')} />
          <FieldError errors={[errors.portfolioUrl]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="website">Website</FieldLabel>
          <Input id="website" placeholder="https://…" {...register('website')} />
          <FieldError errors={[errors.website]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="linkedin">LinkedIn</FieldLabel>
          <Input id="linkedin" placeholder="https://linkedin.com/in/…" {...register('linkedin')} />
          <FieldError errors={[errors.linkedin]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="twitter">Twitter / X</FieldLabel>
          <Input id="twitter" placeholder="https://x.com/…" {...register('twitter')} />
          <FieldError errors={[errors.twitter]} />
        </Field>
        <Button type="submit" disabled={isSubmitting || !isDirty} className="w-fit">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </FieldGroup>
    </form>
  );
}
