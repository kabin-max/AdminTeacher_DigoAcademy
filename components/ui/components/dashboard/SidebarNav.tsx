'use client';

import {
  BookOpen,
  CircleUser,
  CreditCard,
  FolderTree,
  GraduationCap,
  Heart,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Map,
  Megaphone,
  Radio,
  ScrollText,
  Settings,
  Star,
  UserCog,
  Users,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { NavGroup } from '@/shared/components/dashboard/DashboardShell';
import { cn } from '@/shared/utils/cn';

/** Serializable icon keys → lucide icons (keeps the RSC prop boundary clean). */
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  courses: BookOpen,
  live: Radio,
  quizzes: HelpCircle,
  videos: Video,
  wishlist: Heart,
  categories: FolderTree,
  reviews: Star,
  inquiries: Inbox,
  enrollments: GraduationCap,
  paths: Megaphone,
  payments: CreditCard,
  batches: Users,
  plans: Map,
  instructors: UserCog,
  students: Users,
  profile: CircleUser,
  settings: Settings,
  audit: ScrollText,
};

/** Fades content in only when the rail is expanded (hover on desktop, always on mobile). */
const REVEAL = 'transition-opacity duration-150 lg:opacity-0 lg:group-hover/aside:opacity-100';

/**
 * Sidebar navigation with active-link highlighting. The active item is the one
 * whose href is the *longest* prefix of the current path, so "/admin" doesn't
 * light up while you're on "/admin/courses".
 */
export function SidebarNav({
  groups,
  onNavigate,
}: {
  groups: NavGroup[];
  /** Called when a link is activated (used to close the mobile drawer). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
  const matches = hrefs.filter((h) => pathname === h || pathname.startsWith(`${h}/`));
  const activeHref = matches.sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
      {groups.map((group, index) => (
        <div key={group.label ?? index} className="space-y-1">
          {group.label && (
            <div className="relative mb-1 h-4">
              {/* Full heading — mobile always, desktop on hover. */}
              <p className={cn(
                'absolute inset-x-3 top-0 truncate text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/45',
                REVEAL
              )}>
                {group.label}
              </p>
              {/* Collapsed rail: a centered divider stands in for the heading. */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 hidden h-px w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sidebar-foreground/25 transition-opacity duration-150 lg:block lg:group-hover/aside:opacity-0"
              />
            </div>
          )}
          {group.items.map((item) => {
            const Icon = item.icon ? ICONS[item.icon] : undefined;
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm'
                    : 'font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                {Icon && <Icon className="size-5 shrink-0" />}
                <span className={cn('flex-1 truncate', REVEAL)}>{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span
                    className={cn(
                      'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                      active
                        ? 'bg-primary/10 text-sidebar-primary-foreground'
                        : 'bg-sidebar-accent text-sidebar-accent-foreground',
                      REVEAL
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
