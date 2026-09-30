import { BookOpen, Home, Terminal } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      {/* Terminal Graphic */}
      <div className="relative mx-auto flex size-24 items-center justify-center rounded-3xl border border-brand-coral/30 bg-brand-coral/10 text-brand-coral shadow-lg sm:size-28">
        <Terminal className="size-12 sm:size-14" />
        <span className="absolute -bottom-2 -right-2 rounded-full bg-brand-coral px-2.5 py-0.5 font-mono text-[11px] font-bold text-white shadow">
          404
        </span>
      </div>

      <h1 className="mt-8 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        Page Not Found in Production
      </h1>

      <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
        The route you are requesting has moved, been refactored, or exists only in an unmerged branch. Let&apos;s get you back to safety.
      </p>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" className="rounded-full px-7 gap-2 shadow-sm" nativeButton={false} render={<Link href="/"><Home className="size-4" /> Back to Home</Link>} />
        <Button size="lg" variant="outline" className="rounded-full px-7 gap-2" nativeButton={false} render={<Link href="/courses"><BookOpen className="size-4" /> Browse Courses</Link>} />
      </div>

      <p className="mt-8 text-xs text-muted-foreground font-mono">
        HTTP Status: 404 Not Found • Digo Academy Engine
      </p>
    </div>
  );
}
