'use client';

import { toast } from 'sonner';

import { authClient } from '@/lib/auth/client';
import { Button } from '@/shared/components/ui/button';

export function ResendVerification({ email }: { email: string }) {
  async function resend() {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/dashboard',
    });
    if (error) {
      toast.error(error.message ?? 'Could not resend email');
      return;
    }
    toast.success('Verification email sent.');
  }

  return (
    <Button type="button" variant="outline" onClick={resend} disabled={!email}>
      Resend verification email
    </Button>
  );
}
