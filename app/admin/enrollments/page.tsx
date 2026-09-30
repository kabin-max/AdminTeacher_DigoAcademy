import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

import { getEnrollments } from '@/features/enrollment/server/data';
import { ENROLLMENT_MODE_LABELS, type EnrollmentMode } from '@/features/enrollment/schemas';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Badge } from '@/shared/components/ui/badge';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminEnrollmentsPage() {
  await requireRole(ROLES.ADMIN);
  const enrollments = await getEnrollments();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<GraduationCap />}
        title="Enrollments"
        description={`${enrollments.length} enrollment${enrollments.length === 1 ? '' : 's'}. Assign cohorts and record payments per enrollment.`}
      />

      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No enrollments yet. Enroll students from the{' '}
          <Link href="/admin/inquiries" className="underline underline-offset-4">
            inquiries
          </Link>{' '}
          pipeline.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Cohort</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium text-right">Payments</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments.map((e) => (
                <tr key={e.id} className="relative transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/enrollments/${e.id}`}
                      className="font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
                    >
                      {e.student.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{e.student.email}</div>
                  </td>
                  <td className="px-4 py-3">{e.course.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {ENROLLMENT_MODE_LABELS[e.mode as EnrollmentMode]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.batch?.name ?? e.learningPlan?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.progressPct}%</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{e._count.payments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
