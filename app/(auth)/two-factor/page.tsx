import { TotpForm } from '@/features/auth/components/TotpForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export default async function TwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app to finish signing in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TotpForm redirectTo={redirectTo ?? '/dashboard'} />
      </CardContent>
    </Card>
  );
}
