'use client';

import type { ReactNode } from 'react';

import { Toaster } from '@/shared/components/ui/sonner';
import { ConfirmProvider } from '@/shared/hooks/use-confirm';

import { QueryProvider } from './QueryProvider';

/**
 * Aggregates all client-side providers. Add new global providers here
 * (theme, session, etc.) so the root layout stays clean.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ConfirmProvider>
        {children}
        <Toaster richColors position="top-center" />
      </ConfirmProvider>
    </QueryProvider>
  );
}
