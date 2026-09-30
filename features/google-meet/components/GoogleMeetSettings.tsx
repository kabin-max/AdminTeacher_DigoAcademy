'use client';

import { Radio } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';
import { toast } from 'sonner';

import { disconnectGoogleMeet } from '@/features/google-meet/server/actions';
import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const STATUS_MESSAGES: Record<string, { type: 'success' | 'error'; message: string }> = {
  connected: { type: 'success', message: 'Google Calendar connected.' },
  error: { type: 'error', message: 'Could not connect Google Calendar. Try again.' },
  not_configured: {
    type: 'error',
    message: 'Set GOOGLE_MEET_CLIENT_ID/SECRET before connecting.',
  },
};

export function GoogleMeetSettings({
  connection,
  configured,
}: {
  connection: { accountEmail: string; connectedAt: string } | null;
  configured: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    const status = searchParams.get('meet');
    if (!status) return;
    shownRef.current = true;
    const entry = STATUS_MESSAGES[status];
    if (entry) (entry.type === 'success' ? toast.success : toast.error)(entry.message);
    router.replace('/admin/settings');
  }, [searchParams, router]);

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectGoogleMeet();
      if (!result.ok) {
        toast.error(result.error ?? 'Could not disconnect.');
        return;
      }
      toast.success('Google Calendar disconnected.');
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Radio className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Google Meet</p>
            <p className="text-xs text-muted-foreground">
              {connection
                ? `Connected as ${connection.accountEmail}`
                : configured
                  ? 'Not connected — live classes can’t be scheduled yet.'
                  : 'Not configured on this deployment.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connection ? (
            <>
              <Badge variant="secondary">Connected</Badge>
              <Button size="sm" variant="outline" onClick={disconnect} disabled={isPending}>
                {isPending ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            </>
          ) : configured ? (
            <a
              href="/api/google-meet/authorize"
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              Connect Google Calendar
            </a>
          ) : (
            <Button size="sm" disabled>
              Connect Google Calendar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
