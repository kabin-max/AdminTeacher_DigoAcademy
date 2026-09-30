import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';
import { SidebarLayout } from '@/shared/components/dashboard/SidebarLayout';
import { SignOutButton } from '@/shared/components/dashboard/SignOutButton';

export interface NavItem {
  label: string;
  href: string;
  /** Optional icon key resolved to a lucide icon in SidebarNav. */
  icon?: string;
  /** Optional count badge (e.g. items awaiting action). */
  badge?: number;
}

export interface NavGroup {
  /** Optional section heading, e.g. "Content", "Users". */
  label?: string;
  items: NavItem[];
}

export interface DashboardShellProps {
  /** Area label, e.g. "Student", "Instructor", "Admin". */
  area: string;
  userName: string;
  /** Optional longer role label shown under the user's name (sidebar layout). */
  roleLabel?: string;
  /** Primary in-area navigation links (top-bar layout). */
  nav?: NavItem[];
  /** Grouped navigation — when provided, renders a left sidebar instead. */
  navGroups?: NavGroup[];
  children: ReactNode;
}

/**
 * Common chrome for the role dashboards. The three role areas are otherwise
 * isolated (separate route segments + layouts); this just keeps their header
 * consistent without coupling the features together.
 *
 * Two layouts: pass `navGroups` for the full sidebar dashboard (SidebarLayout),
 * or `nav` for the compact top-bar links.
 */
export function DashboardShell({
  area,
  userName,
  roleLabel,
  nav = [],
  navGroups,
  children,
}: DashboardShellProps) {
  if (navGroups && navGroups.length > 0) {
    return (
      <SidebarLayout area={area} userName={userName} roleLabel={roleLabel} navGroups={navGroups}>
        {children}
      </SidebarLayout>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href={`/${area.toLowerCase()}`} className="flex items-center gap-3">
              <BrandLogo className="h-8" />
              <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium">
                {area}
              </span>
            </Link>
            {nav.length > 0 && (
              <nav className="flex items-center gap-4">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{userName}</span>
            <Link
              href="/settings/security"
              className="text-muted-foreground text-sm underline-offset-4 hover:underline"
            >
              Security
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full flex-1 px-4 py-6 sm:px-4 lg:px-4 lg:py-4">{children}</main>
    </div>
  );
}
