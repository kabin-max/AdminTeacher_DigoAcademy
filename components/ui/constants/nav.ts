import type { NavGroup } from '@/shared/components/dashboard/DashboardShell';
import { ROLES, type Role } from '@/shared/constants/roles';

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  { items: [{ label: 'Dashboard', href: '/admin', icon: 'dashboard' }] },
  {
    label: 'Content',
    items: [
      { label: 'Courses', href: '/admin/courses', icon: 'courses' },
      { label: 'Categories', href: '/admin/categories', icon: 'categories' },
      { label: 'Quizzes', href: '/admin/quizzes', icon: 'quizzes' },
      { label: 'Class Videos', href: '/admin/videos', icon: 'videos' },
      { label: 'Reviews', href: '/admin/reviews', icon: 'reviews' },
    ],
  },
  {
    label: 'Enrollment',
    items: [
      { label: 'Inquiries', href: '/admin/inquiries', icon: 'inquiries' },
      { label: 'Enrollments', href: '/admin/enrollments', icon: 'enrollments' },
      { label: 'Learning paths', href: '/admin/learning-paths', icon: 'paths' },
      { label: 'Payments', href: '/admin/payments', icon: 'payments' },
    ],
  },
  {
    label: 'Cohorts',
    items: [
      { label: 'Batches', href: '/admin/batches', icon: 'batches' },
      { label: 'Learning plans', href: '/admin/learning-plans', icon: 'plans' },
    ],
  },
  {
    label: 'Users',
    items: [
      { label: 'Instructors', href: '/admin/users/instructors', icon: 'instructors' },
      { label: 'Students', href: '/admin/users/students', icon: 'students' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: 'settings' },
      { label: 'Audit log', href: '/admin/audit', icon: 'audit' },
    ],
  },
];

export const INSTRUCTOR_NAV_GROUPS: NavGroup[] = [
  { items: [{ label: 'Dashboard', href: '/instructor', icon: 'dashboard' }] },
  {
    label: 'Teaching',
    items: [
      { label: 'Courses', href: '/instructor/courses', icon: 'courses' },
      { label: 'My batches', href: '/instructor/batches', icon: 'batches' },
      { label: 'Quizzes', href: '/instructor/quizzes', icon: 'quizzes' },
      { label: 'Class Videos', href: '/instructor/videos', icon: 'videos' },
    ],
  },
  {
    label: 'Account',
    items: [{ label: 'Profile', href: '/instructor/profile', icon: 'profile' }],
  },
];

export const STUDENT_NAV_GROUPS: NavGroup[] = [
  { items: [{ label: 'Dashboard', href: '/student', icon: 'dashboard' }] },
  {
    label: 'Learning',
    items: [
      { label: 'Browse', href: '/student/courses', icon: 'courses' },
      { label: 'Live classes', href: '/student/live', icon: 'live' },
      { label: 'Quizzes', href: '/student/quizzes', icon: 'quizzes' },
      { label: 'Class Videos', href: '/student/videos', icon: 'videos' },
      { label: 'Wishlist', href: '/student/wishlist', icon: 'wishlist' },
      { label: 'Inquiries', href: '/student/inquiries', icon: 'inquiries' },
    ],
  },
  {
    label: 'Account',
    items: [{ label: 'Profile', href: '/student/profile', icon: 'profile' }],
  },
];

export interface RoleAreaConfig {
  area: string;
  roleLabel: string;
  navGroups: NavGroup[];
}

/**
 * Each role's sidebar chrome (area label, role label, nav groups), keyed by
 * role. The single source of truth for the three role dashboard layouts —
 * and for `/settings`, which has no dashboard of its own and instead borrows
 * whichever role's sidebar the user navigated in from, so leaving the
 * dashboard for Security doesn't swap out to a different (or missing) shell.
 */
export const NAV_BY_ROLE: Record<Role, RoleAreaConfig> = {
  [ROLES.ADMIN]: { area: 'Admin', roleLabel: 'Administrator', navGroups: ADMIN_NAV_GROUPS },
  [ROLES.INSTRUCTOR]: {
    area: 'Instructor',
    roleLabel: 'Instructor',
    navGroups: INSTRUCTOR_NAV_GROUPS,
  },
  [ROLES.STUDENT]: { area: 'Student', roleLabel: 'Student', navGroups: STUDENT_NAV_GROUPS },
};
