'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { cn } from '@/shared/utils/cn';

export function AuthBackButton({
  className,
  label = 'Back to home',
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href="/"
      onClick={(e) => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className={cn(
        'group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
        className
      )}
    >
      <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </Link>
  );
}
