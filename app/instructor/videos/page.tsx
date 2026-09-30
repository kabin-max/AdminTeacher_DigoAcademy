import { Video } from 'lucide-react';

import { CreateVideoModal } from '@/features/videos/components/CreateVideoModal';
import { AdminVideoList } from '@/features/videos/components/AdminVideoList';
import { getInstructorBatchAndCourseOptions, getInstructorVideos } from '@/features/videos/server/data';
import { requireRole } from '@/lib/auth/session';
import { ROLES } from '@/shared/constants/roles';

export default async function InstructorVideosPage() {
  const session = await requireRole(ROLES.INSTRUCTOR);
  const [videos, options] = await Promise.all([
    getInstructorVideos(session.user.id),
    getInstructorBatchAndCourseOptions(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Class Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Standalone library of recorded course videos and batch class recordings.
          </p>
        </div>
        <CreateVideoModal courses={options.courses} batches={options.batches} />
      </div>

      <AdminVideoList videos={videos} />
    </div>
  );
}
