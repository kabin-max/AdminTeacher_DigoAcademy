'use client';

import { Shield } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';
import type { NavGroup } from '@/shared/components/dashboard/DashboardShell';
import { SidebarNav } from '@/shared/components/dashboard/SidebarNav';
import { SignOutButton } from '@/shared/components/dashboard/SignOutButton';
import { Topbar } from '@/shared/components/dashboard/Topbar';
import { cn } from '@/shared/utils/cn';

export interface SidebarLayoutProps {
  area: string;
  userName: string;
  roleLabel?: string;
  navGroups: NavGroup[];
  children: ReactNode;
}

/** Fades a label in only when the rail is expanded (hover on desktop, always on mobile). */
const REVEAL = 'transition-opacity duration-150 lg:opacity-0 lg:group-hover/aside:opacity-100';

/**
 * Full dashboard chrome for the grouped (sidebar) layout: a solid brand sidebar,
 * a sticky top bar, and a soft grey content canvas.
 *
 * On desktop the sidebar is a permanently-collapsed icon rail that expands on
 * hover, reflowing the content column to make room. On mobile it's a slide-in
 * drawer toggled from the top bar. Client component so it can own the drawer
 * state; the server shell passes serializable props + the pre-rendered children.
 */
export function SidebarLayout({
  area,
  userName,
  roleLabel,
  navGroups,
  children,
}: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeDrawer = () => setMobileOpen(false);

  return (
    <div className="flex min-h-svh bg-muted/40">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      <aside
        className={cn(
          'group/aside fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden bg-sidebar text-sidebar-foreground shadow-xl transition-[width,transform] duration-200',
          // Desktop: a collapsed icon rail that grows on hover. `lg:static` takes
          // it out of the fixed-overlay flow so the flex layout below reflows
          // the content column to make room — nothing sits under the rail.
          'lg:static lg:w-20 lg:translate-x-0 lg:shadow-none lg:hover:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Link href={`/${area.toLowerCase()}`} className="relative flex h-16 items-center px-4">
          {/* Collapsed mark (desktop rail only). */}
          <span className="absolute left-4 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl bg-white/15 font-heading text-base font-bold text-sidebar-foreground opacity-0 transition-opacity duration-150 lg:opacity-100 lg:group-hover/aside:opacity-0">
            D
          </span>
          {/* Full wordmark (mobile always; desktop on hover). */}
          <BrandLogo className="absolute left-4 top-1/2 h-7 w-auto -translate-y-1/2 brightness-0 invert transition-opacity duration-150 lg:opacity-0 lg:group-hover/aside:opacity-100" />
        </Link>

        <SidebarNav groups={navGroups} onNavigate={closeDrawer} />

        <div className="mt-auto space-y-1 border-t border-sidebar-border p-3">
          <Link
            href="/settings/security"
            onClick={closeDrawer}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Shield className="size-4.5 shrink-0" />
            <span className={cn('flex-1 truncate', REVEAL)}>Security</span>
          </Link>
          <SignOutButton
            variant="ghost"
            withIcon
            className="h-auto w-full justify-start gap-3 rounded-xl border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg]:size-4.5"
            labelClassName={cn('flex-1 text-left', REVEAL)}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={userName}
          roleLabel={roleLabel}
          onMenuClick={() => setMobileOpen((open) => !open)}
        />
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
