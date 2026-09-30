import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CourseStatusBadge } from '@/features/courses/components/CourseStatusBadge';
import type { CourseStatus } from '@/features/courses/lifecycle';
import {
  UserAccountPanel,
  type AccountPanelUser,
} from '@/features/users/components/UserAccountPanel';
import { getUserDetail, isAccountLocked } from '@/features/users/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ROLES, type Role } from '@/shared/constants/roles';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireRole(ROLES.ADMIN);
  const { userId } = await params;

  const user = await getUserDetail(userId);
  if (!user) notFound();

  const account: AccountPanelUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    status: user.status,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    locked: isAccountLocked(user.lockedUntil),
  };

  const social = (user.instructorProfile?.socialLinks ?? {}) as Record<string, string | undefined>;
  const usersHref = user.role === ROLES.STUDENT ? '/admin/users/students' : '/admin/users/instructors';
  const usersLabel = user.role === ROLES.STUDENT ? 'Students' : 'Instructors';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: usersLabel, href: usersHref },
        ]}
        title={user.name}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span>{user.email}</span>
            <Badge variant="outline">{user.role}</Badge>
            <span className="text-xs">Joined {user.createdAt.toLocaleDateString()}</span>
          </div>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
        <UserAccountPanel user={account} currentUserId={session.user.id} />
      </section>

      {user.role === ROLES.STUDENT && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Student profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Bio</p>
                <p className="text-muted-foreground">{user.studentProfile?.bio || '—'}</p>
              </div>
              <div>
                <p className="font-medium">Skills</p>
                {user.studentProfile?.skills?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {user.studentProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollments ({user.enrollments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {user.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enrollments.</p>
              ) : (
                <ul className="divide-y">
                  {user.enrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span>{e.course.title}</span>
                      <span className="text-xs text-muted-foreground">{e.progressPct}% complete</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {user.role === ROLES.INSTRUCTOR && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Instructor profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Headline</p>
                <p className="text-muted-foreground">{user.instructorProfile?.headline || '—'}</p>
              </div>
              <div>
                <p className="font-medium">Experience</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {user.instructorProfile?.experience || '—'}
                </p>
              </div>
              <div>
                <p className="font-medium">Links</p>
                <p className="text-muted-foreground">
                  {[user.instructorProfile?.portfolioUrl, social.twitter, social.linkedin, social.website]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authored courses ({user.coursesAuthored.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {user.coursesAuthored.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses authored.</p>
              ) : (
                <ul className="divide-y">
                  {user.coursesAuthored.map((course) => (
                    <li key={course.id} className="flex items-center justify-between gap-3 py-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {course.title}
                      </Link>
                      <CourseStatusBadge status={course.status as CourseStatus} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
