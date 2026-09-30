import {
  ArrowRight,
  BookOpen,
  CreditCard,
  FolderTree,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { getAdminOverview } from '@/features/admin/server/overview';
import { getNextLiveClassPlatformWide } from '@/features/cohorts/server/data';
import { requireRole } from '@/lib/auth/session';
import { NextLiveClassCard } from '@/shared/components/dashboard/NextLiveClassCard';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Panel } from '@/shared/components/dashboard/Panel';
import { WidgetCard } from '@/shared/components/dashboard/WidgetCard';
import { ROLES } from '@/shared/constants/roles';
import { formatMoney } from '@/shared/utils/money';
import { cn } from '@/shared/utils/cn';

const QUICK_ACTIONS = [
  { label: 'Review inquiries', href: '/admin/inquiries', icon: Inbox },
  { label: 'Manage courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Manage users', href: '/admin/users/instructors', icon: UserCog },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Platform settings', href: '/admin/settings', icon: Settings },
];

export default async function AdminDashboardPage() {
  await requireRole(ROLES.ADMIN);
  const [overview, nextLiveClass] = await Promise.all([
    getAdminOverview(),
    getNextLiveClassPlatformWide(),
  ]);

  const attention = [
    {
      label: 'Open inquiries',
      count: overview.openInquiries,
      href: '/admin/inquiries',
      hint: 'Move through the enrollment pipeline',
    },
    {
      label: 'Courses awaiting review',
      count: overview.coursesToReview,
      href: '/admin/courses',
      hint: 'Submitted or flagged for re-review',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<LayoutDashboard />}
        title="Admin dashboard"
        description="Manage every entity in the platform — courses, users, enrollments, cohorts, payments, and settings."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WidgetCard
          title="Instructors"
          value={overview.instructors}
          hint="Manage & review accounts"
          icon={<UserCog />}
          accent="blue"
        />
        <WidgetCard
          title="Students"
          value={overview.students}
          hint="Across batches and plans"
          icon={<Users />}
          accent="violet"
        />
        <WidgetCard
          title="Open inquiries"
          value={overview.openInquiries}
          hint="Awaiting the enrollment pipeline"
          icon={<Inbox />}
          accent="amber"
        />
        <WidgetCard
          title="Courses to review"
          value={overview.coursesToReview}
          hint="Submitted or flagged"
          icon={<BookOpen />}
          accent="coral"
        />
        <WidgetCard
          title="Enrollments"
          value={overview.enrollments}
          hint="Active enrollments"
          icon={<GraduationCap />}
          accent="emerald"
        />
        <WidgetCard
          title="Collected"
          value={formatMoney(overview.collectedCents)}
          hint="Recorded payments (paid + partial)"
          icon={<CreditCard />}
          accent="slate"
        />
      </div>

      {nextLiveClass && (
        <NextLiveClassCard
          batchName={nextLiveClass.batchName}
          courseTitle={nextLiveClass.courseTitle}
          meetLink={nextLiveClass.meetLink}
          nextOccurrence={nextLiveClass.nextOccurrence}
          isLive={nextLiveClass.isLive}
          manageHref={`/admin/batches/${nextLiveClass.batchId}`}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">Needs attention</h2>
          </div>
          <div className="mt-4 space-y-3">
            {attention.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3.5 transition-colors hover:border-brand-blue/40 hover:bg-accent/40"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg text-lg font-semibold tabular-nums',
                      item.count > 0
                        ? 'bg-brand-coral/10 text-brand-coral'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.count}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="font-heading text-base font-semibold">Quick actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col gap-2 rounded-xl border bg-card p-3 transition-colors hover:border-brand-blue/40 hover:bg-accent/40"
              >
                <action.icon className="size-4.5 text-brand-blue" />
                <span className="text-xs font-medium leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
