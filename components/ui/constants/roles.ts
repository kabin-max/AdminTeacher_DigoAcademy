/**
 * User roles — mirror the Prisma `Role` enum. Kept as a plain, framework-free
 * module so it is safe to import from both client and server code.
 */
export const ROLES = {
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Home dashboard path for each role (isolated per-role route groups). */
export const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student',
  INSTRUCTOR: '/instructor',
  ADMIN: '/admin',
};

/** Roles for which TOTP MFA is mandatory (students may opt in). */
export const MFA_REQUIRED_ROLES: readonly Role[] = [ROLES.INSTRUCTOR, ROLES.ADMIN];
