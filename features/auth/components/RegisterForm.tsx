'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { registerSchema, type RegisterInput } from '@/features/auth/schemas';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { PasswordInput } from '@/shared/components/ui/password-input';

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    // Public sign-up creates student accounts only. Instructors are created by
    // an admin (Admin ▸ Users ▸ Instructors); there is no public instructor
    // self-registration.
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(error.message ?? 'Registration failed');
      return;
    }

    toast.success('Account created. Check your email to verify your address.');
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Full name <span className="text-destructive">*</span></FieldLabel>
          <Input id="name" autoComplete="name" placeholder="Kaka" {...register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email <span className="text-destructive">*</span></FieldLabel>
          <Input id="email" type="email" autoComplete="email" placeholder="kaka@example.com" {...register('email')} />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password <span className="text-destructive">*</span></FieldLabel>
          <PasswordInput id="password" autoComplete="new-password" placeholder="Create a password" {...register('password')} />
          <FieldError errors={[errors.password]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password <span className="text-destructive">*</span></FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirm your password"
            {...register('confirmPassword')}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </FieldGroup>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
