import { headers } from 'next/headers';

import { MfaSetup } from '@/features/auth/components/MfaSetup';
import {
  SessionsManager,
  type SessionRow,
} from '@/features/auth/components/SessionsManager';
import { auth } from '@/lib/auth';
import { requireUser } from '@/lib/auth/session';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export default async function SecuritySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const [session, { setup }] = await Promise.all([requireUser(), searchParams]);

  const rawSessions = await auth.api.listSessions({ headers: await headers() });
  const sessions: SessionRow[] = rawSessions.map((s) => ({
    id: s.id,
    token: s.token,
    createdAt: new Date(s.createdAt).toISOString(),
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-muted-foreground">Manage two-factor authentication and active sessions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Protect your account with a time-based one-time code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSetup enabled={!!session.user.twoFactorEnabled} required={setup === 'required'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Devices currently signed in to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsManager sessions={sessions} currentToken={session.session.token} />
        </CardContent>
      </Card>
    </div>
  );
}
