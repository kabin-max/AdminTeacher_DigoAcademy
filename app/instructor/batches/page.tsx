import { Users } from 'lucide-react';
import Link from 'next/link';

import { getInstructorBatches } from '@/features/cohorts/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Badge } from '@/shared/components/ui/badge';
import { buttonVariants } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';
import { cn } from '@/shared/utils/cn';

export default async function InstructorBatchesPage() {
  const session = await requireRole(ROLES.INSTRUCTOR);
  const batches = await getInstructorBatches(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Instructor', href: '/instructor' }]}
        icon={<Users />}
        title="My batches"
        description="Manage each batch's weekly class link and class videos."
      />

      {batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No batches assigned to you yet. An admin assigns instructors to batches.
        </p>
      ) : (
        <ul className="space-y-2">
          {batches.map((batch) => (
            <li key={batch.id} className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
              <Link href={`/instructor/batches/${batch.id}`} className="min-w-0 flex-1 hover:opacity-80">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{batch.name}</span>
                  {batch._count.enrollments > 0 && (
                    <Badge variant="secondary">{batch._count.enrollments} enrolled</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{batch.course.title}</p>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                {batch.meetLink ? (
                  <a
                    href={batch.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                  >
                    Join
                  </a>
                ) : (
                  <Badge variant="outline">No Meet link yet</Badge>
                )}
                <Link
                  href={`/instructor/batches/${batch.id}`}
                  className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}
                >
                  Manage
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
