import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';

import { BatchVideoManager } from '@/features/batch-videos/components/BatchVideoManager';
import { getBatchVideos } from '@/features/batch-videos/server/data';
import { BatchScheduleForm } from '@/features/cohorts/components/BatchScheduleForm';
import { getInstructorBatch } from '@/features/cohorts/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function InstructorBatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const session = await requireRole(ROLES.INSTRUCTOR);
  const { batchId } = await params;

  const batch = await getInstructorBatch(batchId, session.user.id);
  if (!batch) notFound();

  const videos = await getBatchVideos(batchId);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Instructor', href: '/instructor' },
          { label: 'My batches', href: '/instructor/batches' },
        ]}
        icon={<Users />}
        title={batch.name}
        description={batch.course.title}
      />

      <div className="rounded-lg border p-4">
        <BatchScheduleForm
          batchId={batch.id}
          startDate={batch.startDate?.toISOString() ?? null}
          endDate={batch.endDate?.toISOString() ?? null}
          meetLink={batch.meetLink}
        />
      </div>

      <BatchVideoManager batchId={batch.id} videos={videos} />
    </div>
  );
}
