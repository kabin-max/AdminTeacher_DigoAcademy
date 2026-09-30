import type { ReactNode } from 'react';

import { AuthBackButton } from '@/features/auth/components/AuthBackButton';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-1 flex-col items-center justify-center gap-4 bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <AuthBackButton className="mb-4" />
        {children}
      </div>
    </main>
  );
}
