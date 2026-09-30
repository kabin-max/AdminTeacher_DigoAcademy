'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth/client';
import { Button } from '@/shared/components/ui/button';

export interface SessionRow {
  id: string;
  token: string;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function SessionsManager({
  sessions,
  currentToken,
}: {
  sessions: SessionRow[];
  currentToken: string;
}) {
  const router = useRouter();
  const [busyToken, setBusyToken] = useState<string | null>(null);

  async function revoke(token: string, isCurrent: boolean) {
    setBusyToken(token);
    const { error } = await authClient.revokeSession({ token });
    setBusyToken(null);
    if (error) {
      toast.error(error.message ?? 'Could not revoke session');
      return;
    }
    if (isCurrent) {
      router.push('/login');
      return;
    }
    toast.success('Session revoked.');
    router.refresh();
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No active sessions.</p>;
  }

  return (
    <ul className="divide-y rounded-md border">
      {sessions.map((session) => {
        const isCurrent = session.token === currentToken;
        return (
          <li key={session.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm">
                {session.userAgent ?? 'Unknown device'}
                {isCurrent && (
                  <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    This device
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.ipAddress ?? 'unknown IP'} · since{' '}
                {new Date(session.createdAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={busyToken === session.token}
              onClick={() => revoke(session.token, isCurrent)}
            >
              {isCurrent ? 'Sign out' : 'Revoke'}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
