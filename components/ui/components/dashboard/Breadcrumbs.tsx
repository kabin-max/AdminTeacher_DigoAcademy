import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface Crumb {
  label: string;
  href: string;
}

/**
 * Path shown above a page's title, e.g. "🏠 Admin › Courses › AI Practitioner".
 * `items` are the clickable ancestors (a home icon marks the root one);
 * `current` is the page being viewed — plain text, not a link, since it's
 * already where you are.
 */
export function Breadcrumbs({ items, current }: { items: Crumb[]; current?: ReactNode }) {
  if (items.length === 0 && !current) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />}
          <Link
            href={crumb.href}
            className="flex items-center gap-1 font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {index === 0 && <Home className="size-3.5 shrink-0" />}
            {crumb.label}
          </Link>
        </span>
      ))}
      {current && (
        <span className="flex items-center gap-1.5">
          {items.length > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />}
          <span className="font-medium text-foreground">{current}</span>
        </span>
      )}
    </nav>
  );
}
