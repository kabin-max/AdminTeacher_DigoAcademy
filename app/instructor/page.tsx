import { getNextLiveClassForInstructor } from '@/features/cohorts/server/data';
import { getInstructorProfile } from '@/features/profile/server/data';
import { requireRole } from '@/lib/auth/session';
import { NextLiveClassCard } from '@/shared/components/dashboard/NextLiveClassCard';
import { WidgetCard } from '@/shared/components/dashboard/WidgetCard';
import { ROLES } from '@/shared/constants/roles';

export default async function InstructorDashboardPage() {
  const session = await requireRole(ROLES.INSTRUCTOR);
  const [profile, nextLiveClass] = await Promise.all([
    getInstructorProfile(session.user.id),
    getNextLiveClassForInstructor(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Instructor dashboard</h1>
        <p className="text-muted-foreground">
          Your courses, students, and earnings will appear here. Course building lands in a later phase.
        </p>
      </div>

      {nextLiveClass && (
        <NextLiveClassCard
          batchName={nextLiveClass.batchName}
          courseTitle={nextLiveClass.courseTitle}
          meetLink={nextLiveClass.meetLink}
          nextOccurrence={nextLiveClass.nextOccurrence}
          isLive={nextLiveClass.isLive}
          manageHref={`/instructor/batches/${nextLiveClass.batchId}`}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <WidgetCard title="Courses" value={0} hint="You haven't created any yet." />
        <WidgetCard title="Total students" value={profile.totalStudents} hint="Across all courses." />
        <WidgetCard
          title="Rating"
          value={profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}
          hint="Average of student reviews."
        />
        <WidgetCard title="Revenue" value="—" hint="Populates as payments are recorded." />
      </div>
    </div>
  );
}
