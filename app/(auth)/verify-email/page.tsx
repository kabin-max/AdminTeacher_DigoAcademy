import Link from 'next/link';

import { ResendVerification } from '@/features/auth/components/ResendVerification';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          {email ? (
            <>
              We sent a verification link to <span className="font-medium">{email}</span>. Click it to
              activate your account.
            </>
          ) : (
            'We sent you a verification link. Click it to activate your account.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {email ? <ResendVerification email={email} /> : null}
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
