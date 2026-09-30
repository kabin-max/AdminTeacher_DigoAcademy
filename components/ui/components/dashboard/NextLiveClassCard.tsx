import { Radio, Video } from 'lucide-react';
import Link from 'next/link';

import { LiveCountdown } from '@/shared/components/dashboard/LiveCountdown';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export interface NextLiveClassCardProps {
  batchName: string;
  courseTitle: string;
  meetLink: string | null;
  nextOccurrence: string;
  isLive: boolean;
  /** Link to the batch's manage/edit page (admin & instructor only). */
  manageHref?: string;
}

/** Compact "next live class" widget for the admin/instructor/student dashboards. */
export function NextLiveClassCard({
  batchName,
  courseTitle,
  meetLink,
  nextOccurrence,
  isLive,
  manageHref,
}: NextLiveClassCardProps) {
  return (
    <Card className="gap-3 rounded-2xl border border-border/70 p-5 shadow-sm ring-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue [&_svg]:size-5">
            <Radio />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Next live class</p>
            <p className="truncate font-heading text-base font-semibold">{batchName}</p>
            <p className="truncate text-xs text-muted-foreground">{courseTitle}</p>
          </div>
        </div>
        <LiveCountdown target={nextOccurrence} live={isLive} muted className="shrink-0" />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {meetLink ? (
          <Button
            size="sm"
            className="rounded-full"
            nativeButton={false}
            render={
              <a href={meetLink} target="_blank" rel="noopener noreferrer">
                <Video className="size-4" />
                Join
              </a>
            }
          />
        ) : (
          <Button size="sm" className="rounded-full" disabled>
            <Video className="size-4" />
            Link coming soon
          </Button>
        )}
        {manageHref && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            nativeButton={false}
            render={<Link href={manageHref}>Manage</Link>}
          />
        )}
      </div>
    </Card>
  );
}
