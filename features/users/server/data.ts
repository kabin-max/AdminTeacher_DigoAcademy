import 'server-only';

import { db } from '@/lib/db';
import type { Role } from '@/shared/constants/roles';

/** Users for the admin management table, newest first. Optionally filtered by role. */
export async function getAllUsers(role?: Role) {
  return db.user.findMany({
    where: role ? { role } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });
}

export type AdminUserRow = Awaited<ReturnType<typeof getAllUsers>>[number];

/** Full detail for the admin user management page: account, profile, and content. */
export async function getUserDetail(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      twoFactorEnabled: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdAt: true,
      studentProfile: { select: { bio: true, skills: true } },
      instructorProfile: {
        select: { headline: true, experience: true, portfolioUrl: true, socialLinks: true },
      },
      coursesAuthored: {
        select: { id: true, title: true, status: true },
        orderBy: { updatedAt: 'desc' },
      },
      enrollments: {
        select: { id: true, progressPct: true, course: { select: { id: true, title: true } } },
        orderBy: { enrolledAt: 'desc' },
      },
    },
  });
}

export type UserDetail = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>;

/** Whether a password-login lock is currently in effect. */
export function isAccountLocked(lockedUntil: Date | null): boolean {
  return !!lockedUntil && lockedUntil.getTime() > Date.now();
}
