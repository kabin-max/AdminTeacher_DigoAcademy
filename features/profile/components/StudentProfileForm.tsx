'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateStudentProfile } from '@/features/profile/server/actions';
import { studentProfileSchema, type StudentProfileInput } from '@/features/profile/schemas';
import type { StudentProfileView } from '@/features/profile/types';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

export function StudentProfileForm({ profile }: { profile: StudentProfileView }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      name: profile.name,
      bio: profile.bio,
      skills: profile.skills.join(', '),
    },
  });

  async function onSubmit(values: StudentProfileInput) {
    const result = await updateStudentProfile(values);
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
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea id="bio" rows={4} {...register('bio')} />
          <FieldDescription>A short introduction shown on your profile.</FieldDescription>
          <FieldError errors={[errors.bio]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="skills">Skills</FieldLabel>
          <Input id="skills" placeholder="React, TypeScript, Design" {...register('skills')} />
          <FieldDescription>Comma-separated.</FieldDescription>
          <FieldError errors={[errors.skills]} />
        </Field>
        <Button type="submit" disabled={isSubmitting || !isDirty} className="w-fit">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </FieldGroup>
    </form>
  );
}
