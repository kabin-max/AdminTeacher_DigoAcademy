import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';

import { BatchVideoManager } from '@/features/batch-videos/components/BatchVideoManager';
import { getBatchVideos } from '@/features/batch-videos/server/data';
import { BatchEditForm } from '@/features/cohorts/components/BatchEditForm';
import { getBatch, getCourseChoices, getInstructorChoices } from '@/features/cohorts/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  await requireRole(ROLES.ADMIN);
  const { batchId } = await params;

  const [batch, courses, instructors] = await Promise.all([
    getBatch(batchId),
    getCourseChoices(),
    getInstructorChoices(),
  ]);
  if (!batch) notFound();

  const videos = await getBatchVideos(batchId);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Batches', href: '/admin/batches' },
        ]}
        icon={<Users />}
        title={`Edit ${batch.name}`}
      />

      <div className="rounded-lg border p-4">
        <BatchEditForm
          batchId={batch.id}
          initial={{
            name: batch.name,
            courseId: batch.courseId,
            instructorId: batch.instructorId,
            startDate: batch.startDate?.toISOString() ?? null,
            endDate: batch.endDate?.toISOString() ?? null,
            capacity: batch.capacity,
          }}
          meetLink={batch.meetLink}
          courses={courses.map((c) => ({ id: c.id, name: c.title }))}
          instructors={instructors}
        />
      </div>

      <BatchVideoManager batchId={batch.id} videos={videos} />
    </div>
  );
}
