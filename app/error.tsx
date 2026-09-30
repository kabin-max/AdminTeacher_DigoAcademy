'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/10 text-destructive shadow-lg sm:size-24">
        <AlertTriangle className="size-10 sm:size-12" />
      </div>

      <h1 className="mt-8 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Something went wrong
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        An unexpected runtime error occurred while processing this view. Our engineering team has been automatically alerted.
      </p>

      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Incident Digest: <span className="font-bold text-foreground">{error.digest}</span>
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" className="rounded-full px-7 gap-2 shadow-sm" onClick={() => reset()}>
          <RefreshCw className="size-4" /> Try Again
        </Button>
        <Button size="lg" variant="outline" className="rounded-full px-7 gap-2" nativeButton={false} render={<Link href="/"><Home className="size-4" /> Back to Home</Link>} />
      </div>
    </div>
  );
}
