'use server';

import { APIError } from 'better-auth/api';
import { revalidatePath } from 'next/cache';

import { createInstructorSchema, type CreateInstructorInput } from '@/features/users/schemas';
import { recordAudit } from '@/lib/audit';
import { auth } from '@/lib/auth';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES, type Role } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}
export interface CreateInstructorResult extends ActionResult {
  userId?: string;
}

/**
 * Provision an instructor account (admin only). Reuses the Better Auth sign-up
 * path (so the password is hashed the same way as normal accounts), then
 * elevates the role to INSTRUCTOR — `role` is `input:false`, so it can't be set
 * through sign-up itself. The email is marked verified because the admin is
 * vouching for the account, letting the instructor sign in immediately.
 *
 * `requireEmailVerification` is on, so sign-up does not create a session — the
 * admin's own session is unaffected.
 */
export async function createInstructor(
  input: CreateInstructorInput
): Promise<CreateInstructorResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createInstructorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { name, email, password } = parsed.data;

  try {
    const result = await auth.api.signUpEmail({ body: { name, email, password } });
    await db.user.update({
      where: { id: result.user.id },
      data: { role: ROLES.INSTRUCTOR, emailVerified: true },
    });
    await recordAudit({
      actorId: session.user.id,
      action: 'user.created',
      entityType: 'User',
      entityId: result.user.id,
      metadata: { email, role: ROLES.INSTRUCTOR },
    });

    revalidatePath('/admin/users/instructors');
    return { ok: true, userId: result.user.id };
  } catch (error) {
    if (error instanceof APIError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: 'Could not create instructor.' };
  }
}

const USER_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;
type UserStatus = (typeof USER_STATUSES)[number];

const VALID_ROLES = Object.values(ROLES) as Role[];

/** Revalidate every place a user's summary/detail is shown. */
function revalidateUser(userId: string) {
  revalidatePath('/admin/users/instructors');
  revalidatePath('/admin/users/students');
  revalidatePath(`/admin/users/${userId}`);
}

export async function setUserRole(userId: string, role: Role): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (!VALID_ROLES.includes(role)) return { ok: false, error: 'Invalid role.' };
  // Guard against self-demotion locking the admin out of this area.
  if (userId === session.user.id) return { ok: false, error: 'You cannot change your own role.' };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: 'User not found.' };
  if (user.role === role) return { ok: true };

  await db.user.update({ where: { id: userId }, data: { role } });
  await recordAudit({
    actorId: session.user.id,
    action: 'user.roleChanged',
    entityType: 'User',
    entityId: userId,
    metadata: { from: user.role, to: role },
  });

  revalidateUser(userId);
  return { ok: true };
}

export async function setUserStatus(userId: string, status: UserStatus): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (!USER_STATUSES.includes(status)) return { ok: false, error: 'Invalid status.' };
  // Admins cannot suspend themselves.
  if (userId === session.user.id) return { ok: false, error: 'You cannot suspend your own account.' };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: 'User not found.' };
  if (user.status === status) return { ok: true };

  await db.user.update({ where: { id: userId }, data: { status } });
  await recordAudit({
    actorId: session.user.id,
    action: status === 'SUSPENDED' ? 'user.suspended' : 'user.reactivated',
    entityType: 'User',
    entityId: userId,
  });

  revalidateUser(userId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Detailed management (per-user admin page).
// ---------------------------------------------------------------------------

export async function adminUpdateUserName(userId: string, name: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: 'Name is too short.' };
  if (trimmed.length > 100) return { ok: false, error: 'Name is too long.' };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: 'User not found.' };

  await db.user.update({ where: { id: userId }, data: { name: trimmed } });
  await recordAudit({
    actorId: session.user.id,
    action: 'user.nameChanged',
    entityType: 'User',
    entityId: userId,
    metadata: { from: user.name, to: trimmed },
  });

  revalidateUser(userId);
  return { ok: true };
}

/** Clear a password-login lockout (failed attempts + lock window). */
export async function adminUnlockAccount(userId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: 'User not found.' };

  await db.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'user.unlocked',
    entityType: 'User',
    entityId: userId,
  });

  revalidateUser(userId);
  return { ok: true };
}

/**
 * Remove a user's TOTP MFA (admin override — no password needed). If MFA is
 * mandatory for their role they'll be prompted to re-enroll on next sign-in.
 */
export async function adminResetTwoFactor(userId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: 'User not found.' };
  if (!user.twoFactorEnabled) return { ok: true };

  await db.$transaction([
    db.twoFactor.deleteMany({ where: { userId } }),
    db.user.update({ where: { id: userId }, data: { twoFactorEnabled: false } }),
  ]);
  await recordAudit({
    actorId: session.user.id,
    action: 'user.twoFactorReset',
    entityType: 'User',
    entityId: userId,
  });

  revalidateUser(userId);
  return { ok: true };
}

/** Manually mark a user's email verified (e.g. bypass a stuck verification). */
export async function adminVerifyEmail(userId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: 'User not found.' };
  if (user.emailVerified) return { ok: true };

  await db.user.update({ where: { id: userId }, data: { emailVerified: true } });
  await recordAudit({
    actorId: session.user.id,
    action: 'user.emailVerified',
    entityType: 'User',
    entityId: userId,
  });

  revalidateUser(userId);
  return { ok: true };
}

/**
 * Delete a user. Blocked for self and for users who still own content
 * (authored courses / enrollments) — deleting the User cascades to those, so we
 * require the admin to reassign or remove that content first.
 */
export async function adminDeleteUser(userId: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (userId === session.user.id) return { ok: false, error: 'You cannot delete your own account.' };

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { coursesAuthored: true, enrollments: true } } },
  });
  if (!user) return { ok: false, error: 'User not found.' };

  if (user._count.coursesAuthored > 0) {
    return {
      ok: false,
      error: `This instructor authored ${user._count.coursesAuthored} course(s). Reassign or delete them first.`,
    };
  }
  if (user._count.enrollments > 0) {
    return {
      ok: false,
      error: `This student has ${user._count.enrollments} enrollment(s). Remove them first.`,
    };
  }

  await db.user.delete({ where: { id: userId } });
  await recordAudit({
    actorId: session.user.id,
    action: 'user.deleted',
    entityType: 'User',
    entityId: userId,
    metadata: { email: user.email, name: user.name },
  });

  revalidatePath('/admin/users/instructors');
  revalidatePath('/admin/users/students');
  return { ok: true };
}
