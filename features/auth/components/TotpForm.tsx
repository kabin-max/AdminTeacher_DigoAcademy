'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { totpSchema, type TotpInput } from '@/features/auth/schemas';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';

export function TotpForm({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpInput>({ resolver: zodResolver(totpSchema) });

  async function onSubmit(values: TotpInput) {
    const { error } = await authClient.twoFactor.verifyTotp({ code: values.code });
    if (error) {
      toast.error(error.message ?? 'Invalid code');
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="code">Authentication code</FieldLabel>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            {...register('code')}
          />
          <FieldError errors={[errors.code]} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying…' : 'Verify'}
        </Button>
      </FieldGroup>
    </form>
  );
}
