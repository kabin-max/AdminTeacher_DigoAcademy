import type { Role } from '@/shared/constants/roles';

/**
 * Course lifecycle state machine. Pure + framework-free so it can be reused on the
 * server (transition guard) and client (which actions to show). The DB enum is
 * CourseStatus: DRAFT | SUBMITTED | PUBLISHED | UNPUBLISHED | SUSPENDED.
 */
export type CourseStatus = 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'UNPUBLISHED' | 'SUSPENDED';

export type CourseAction =
  | 'submit'
  | 'withdraw'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'unpublish'
  | 'republish'
  | 'suspend'
  | 'unsuspend';

export interface CourseTransition {
  action: CourseAction;
  from: CourseStatus;
  to: CourseStatus;
  /** Role permitted to perform it. */
  role: Role;
  /** When true, the actor must own the course (instructor transitions). */
  owner?: boolean;
  /** Human label for buttons/audit. */
  label: string;
}

export const COURSE_TRANSITIONS: readonly CourseTransition[] = [
  { action: 'submit', from: 'DRAFT', to: 'SUBMITTED', role: 'INSTRUCTOR', owner: true, label: 'Submit for review' },
  { action: 'withdraw', from: 'SUBMITTED', to: 'DRAFT', role: 'INSTRUCTOR', owner: true, label: 'Withdraw' },
  { action: 'approve', from: 'SUBMITTED', to: 'PUBLISHED', role: 'ADMIN', label: 'Approve & publish' },
  { action: 'reject', from: 'SUBMITTED', to: 'DRAFT', role: 'ADMIN', label: 'Request changes' },
  // Admin is a super-user and can publish a draft directly (no instructor submit step).
  { action: 'publish', from: 'DRAFT', to: 'PUBLISHED', role: 'ADMIN', label: 'Publish' },
  { action: 'unpublish', from: 'PUBLISHED', to: 'UNPUBLISHED', role: 'ADMIN', label: 'Unpublish' },
  { action: 'republish', from: 'UNPUBLISHED', to: 'PUBLISHED', role: 'ADMIN', label: 'Republish' },
  { action: 'suspend', from: 'PUBLISHED', to: 'SUSPENDED', role: 'ADMIN', label: 'Suspend' },
  { action: 'suspend', from: 'UNPUBLISHED', to: 'SUSPENDED', role: 'ADMIN', label: 'Suspend' },
  { action: 'unsuspend', from: 'SUSPENDED', to: 'UNPUBLISHED', role: 'ADMIN', label: 'Reinstate' },
];

/** Find the transition matching an action from a given status (if any). */
export function findTransition(action: CourseAction, from: CourseStatus): CourseTransition | undefined {
  return COURSE_TRANSITIONS.find((t) => t.action === action && t.from === from);
}

/** Whether `role`/ownership may run `action` from `from`. */
export function canTransition(
  action: CourseAction,
  from: CourseStatus,
  role: Role,
  isOwner: boolean
): boolean {
  const t = findTransition(action, from);
  if (!t || t.role !== role) return false;
  if (t.owner && !isOwner) return false;
  return true;
}

/** Transitions available to a given actor for the current status (for rendering). */
export function availableTransitions(
  from: CourseStatus,
  role: Role,
  isOwner: boolean
): CourseTransition[] {
  return COURSE_TRANSITIONS.filter(
    (t) => t.from === from && t.role === role && (!t.owner || isOwner)
  );
}
