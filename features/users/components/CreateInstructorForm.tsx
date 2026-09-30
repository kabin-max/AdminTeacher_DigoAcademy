'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createInstructorSchema, type CreateInstructorInput } from '@/features/users/schemas';
import { createInstructor } from '@/features/users/server/actions';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';

export function CreateInstructorForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateInstructorInput>({ resolver: zodResolver(createInstructorSchema) });

  async function onSubmit(values: CreateInstructorInput) {
    const result = await createInstructor(values);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not create instructor.');
      return;
    }
    toast.success('Instructor account created.');
    router.push('/admin/users/instructors');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" autoComplete="off" {...register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="off" {...register('email')} />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Initial password</FieldLabel>
          <Input id="password" type="text" autoComplete="off" {...register('password')} />
          <FieldError errors={[errors.password]} />
          <FieldDescription>
            Share this with the instructor — they can change it after signing in. The account is
            created verified, so they can log in right away.
          </FieldDescription>
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create instructor'}
          </Button>
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/users/instructors">Cancel</Link>}
          />
        </div>
      </FieldGroup>
    </form>
  );
}
