'use client';

import { Bell, Menu } from 'lucide-react';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function NotificationsButton() {
  return (
    <button
      type="button"
      disabled
      aria-label="Notifications — coming soon"
      title="Notifications — coming soon"
      className="flex size-10 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground/40"
    >
      <Bell className="size-5" />
    </button>
  );
}

export interface TopbarProps {
  userName: string;
  roleLabel?: string;
  onMenuClick?: () => void;
}

/**
 * Jobie-style top bar: mobile menu toggle, quick-action icons, and a user
 * chip. Composed from wrapper components + shadcn primitives — no generated
 * primitives are modified.
 *
 * No "Queries" icon here — Inquiries is already a sidebar nav item, so a
 * second entry point in the top bar would just be a duplicate. Notifications
 * has no backing feature yet, so it's rendered disabled rather than as a
 * dead-looking clickable icon.
 */
export function Topbar({ userName, roleLabel, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={onMenuClick}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <NotificationsButton />

          <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials(userName)}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold">{userName}</p>
              {roleLabel && <p className="text-xs text-muted-foreground">{roleLabel}</p>}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
