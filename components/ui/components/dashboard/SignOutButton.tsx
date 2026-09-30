'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

import { authClient } from '@/lib/auth/client';
import { Button } from '@/shared/components/ui/button';

export interface SignOutButtonProps {
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  className?: string;
  /** Extra classes for the "Sign out" label span (e.g. to fade it in a collapsed rail). */
  labelClassName?: string;
  /** Show a leading log-out icon. */
  withIcon?: boolean;
}

export function SignOutButton({
  variant = 'outline',
  size = 'sm',
  className,
  labelClassName,
  withIcon = false,
}: SignOutButtonProps) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={signOut}>
      {withIcon && <LogOut />}
      <span className={labelClassName}>Sign out</span>
    </Button>
  );
}
