import { Megaphone } from 'lucide-react';

import { CoursePicker } from '@/features/audience/components/CoursePicker';
import { SegmentToolbar } from '@/features/audience/components/SegmentToolbar';
import {
  applySegmentFilter,
  getCourseSegment,
  getSegmentCourses,
  isSegmentFilter,
  type SegmentPerson,
} from '@/features/audience/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Badge } from '@/shared/components/ui/badge';
import { ROLES } from '@/shared/constants/roles';

export default async function LearningPathsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; filter?: string }>;
}) {
  await requireRole(ROLES.ADMIN);
  const { courseId, filter: filterParam } = await searchParams;
  const filter = isSegmentFilter(filterParam) ? filterParam : 'all';

  const courses = await getSegmentCourses();
  const segment = courseId ? await getCourseSegment(courseId) : null;
  const people = segment ? applySegmentFilter(segment.people, filter) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<Megaphone />}
        title="Learning paths"
        description="Group students by the course they're learning or interested in, then export the list to reach out about discounts and offers."
      />

      <CoursePicker courses={courses} value={courseId} />

      {!segment ? (
        <p className="text-sm text-muted-foreground">Pick a course to see its audience.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Total contacts" value={segment.counts.total} />
            <Stat label="Enrolled" value={segment.counts.enrolled} />
            <Stat label="Inquired" value={segment.counts.inquired} />
            <Stat label="Wishlisted" value={segment.counts.wishlisted} />
          </div>

          <SegmentToolbar courseId={segment.course.id} filter={filter} />

          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts in this segment.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Engagement</th>
                    <th className="px-4 py-3 font-medium">Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {people.map((person) => (
                    <tr key={person.key} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{person.name}</div>
                        <div className="text-xs text-muted-foreground">{person.email || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{person.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <EngagementBadges person={person} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {person.since.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function EngagementBadges({ person }: { person: SegmentPerson }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {person.enrolled && (
        <Badge variant="secondary">Enrolled · {person.progressPct ?? 0}%</Badge>
      )}
      {person.inquiryStatus && <Badge variant="outline">Inquiry: {person.inquiryStatus}</Badge>}
      {person.wishlisted && <Badge variant="outline">Wishlist</Badge>}
    </div>
  );
}
