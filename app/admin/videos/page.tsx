import { Video } from 'lucide-react';

import { CreateVideoModal } from '@/features/videos/components/CreateVideoModal';
import { AdminVideoList } from '@/features/videos/components/AdminVideoList';
import { getAdminVideos, getInstructorBatchAndCourseOptions } from '@/features/videos/server/data';
import { requireRole } from '@/lib/auth/session';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminVideosPage() {
  const session = await requireRole(ROLES.ADMIN);
  const [videos, options] = await Promise.all([
    getAdminVideos(),
    getInstructorBatchAndCourseOptions(session.user.id, true),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Class Videos (Admin)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview and upload of class videos across the platform.
          </p>
        </div>
        <CreateVideoModal courses={options.courses} batches={options.batches} />
      </div>

      <AdminVideoList videos={videos} />
    </div>
  );
}
