import { Inbox } from 'lucide-react';

import {
  InquiriesTable,
  type InquiryRow,
} from '@/features/enrollment/components/InquiriesTable';
import { getInquiries } from '@/features/enrollment/server/data';
import type { InquiryStatus } from '@/features/enrollment/pipeline';
import type { EnrollmentMode } from '@/features/enrollment/schemas';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminInquiriesPage() {
  await requireRole(ROLES.ADMIN);
  const inquiries = await getInquiries();
  const open = inquiries.filter((i) => i.status !== 'ENROLLED' && i.status !== 'DECLINED').length;

  const rows: InquiryRow[] = inquiries.map((i) => ({
    id: i.id,
    status: i.status as InquiryStatus,
    mode: i.mode as EnrollmentMode,
    message: i.message,
    createdAt: i.createdAt.toISOString(),
    contact: i.student
      ? { name: i.student.name, email: i.student.email, isGuest: false }
      : {
          name: i.guestName ?? 'Guest',
          email: i.guestEmail ?? '—',
          phone: i.guestPhone,
          isGuest: true,
        },
    course: { id: i.course.id, title: i.course.title },
    batches: i.course.batches,
    learningPlans: i.course.learningPlans,
    enrolled: !!i.enrollment,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<Inbox />}
        title="Inquiries"
        description={`${inquiries.length} total · ${open} open. Walk each through New → Contacted → Confirmed, then enroll.`}
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No inquiries yet.</p>
      ) : (
        <InquiriesTable inquiries={rows} />
      )}
    </div>
  );
}
