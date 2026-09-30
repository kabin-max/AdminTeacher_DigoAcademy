'use client';

import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { SegmentFilter } from '@/features/audience/server/data';
import { Button } from '@/shared/components/ui/button';

const FILTERS: { key: SegmentFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'leads', label: 'Leads' },
  { key: 'enrolled', label: 'Enrolled' },
];

/** Engagement filter chips + a CSV export link for the current segment. */
export function SegmentToolbar({ courseId, filter }: { courseId: string; filter: SegmentFilter }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex gap-1 rounded-lg border p-0.5">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            type="button"
            size="sm"
            variant={filter === f.key ? 'default' : 'ghost'}
            onClick={() =>
              router.push(`/admin/learning-paths?courseId=${courseId}&filter=${f.key}`)
            }
          >
            {f.label}
          </Button>
        ))}
      </div>
      <Button
        nativeButton={false}
        variant="outline"
        size="sm"
        render={
          <a href={`/admin/learning-paths/export?courseId=${courseId}&filter=${filter}`} />
        }
      >
        <Download />
        Export CSV
      </Button>
    </div>
  );
}
