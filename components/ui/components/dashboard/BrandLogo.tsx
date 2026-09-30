import Image from 'next/image';

import { cn } from '@/shared/utils/cn';

/**
 * Digo Academy brand lockup. Size it with a width/height utility on `className`
 * (the other dimension stays auto to preserve the logo's aspect ratio).
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand-logo.png"
      alt="Digo Academy"
      width={190}
      height={100}
      priority
      className={cn('h-auto w-auto', className)}
    />
  );
}
