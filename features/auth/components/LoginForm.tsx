'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { PasswordInput } from '@/shared/components/ui/password-input';
import { Separator } from '@/shared/components/ui/separator';

export function LoginForm({
  googleEnabled = false,
  redirectTo = '/dashboard',
}: {
  googleEnabled?: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message ?? 'Invalid email or password');
      return;
    }

    // Better Auth signals a required second factor with `twoFactorRedirect`.
    if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
      router.push(`/two-factor?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email <span className="text-destructive">*</span></FieldLabel>
            <Input id="email" type="email" autoComplete="email" placeholder="kaka@example.com" {...register('email')} />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password <span className="text-destructive">*</span></FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput id="password" autoComplete="current-password" placeholder="Enter your password" {...register('password')} />
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </FieldGroup>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: redirectTo })}
          >
            Continue with Google
          </Button>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
