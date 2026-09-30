'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  adminDeleteUser,
  adminResetTwoFactor,
  adminUnlockAccount,
  adminUpdateUserName,
  adminVerifyEmail,
  setUserRole,
  setUserStatus,
} from '@/features/users/server/actions';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROLES, type Role } from '@/shared/constants/roles';
import { useConfirm } from '@/shared/hooks/use-confirm';

export interface AccountPanelUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  locked: boolean;
}

const selectClass =
  'h-8 rounded-lg border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50';

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function UserAccountPanel({
  user,
  currentUserId,
}: {
  user: AccountPanelUser;
  currentUserId: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user.name);
  const isSelf = user.id === currentUserId;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? 'Something went wrong.');
        return;
      }
      toast.success(success);
      router.refresh();
    });

  function saveName() {
    const trimmed = name.trim();
    if (trimmed === user.name) {
      setEditingName(false);
      return;
    }
    startTransition(async () => {
      const result = await adminUpdateUserName(user.id, trimmed);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not rename.');
        return;
      }
      toast.success(`Name updated to "${trimmed}".`);
      setEditingName(false);
      router.refresh();
    });
  }

  async function deleteUser() {
    const ok = await confirm({
      title: `Delete ${user.name}?`,
      description: 'This permanently removes their account. This cannot be undone.',
      confirmLabel: 'Delete user',
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await adminDeleteUser(user.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete user.');
        return;
      }
      toast.success(`${user.name} deleted.`);
      router.push(user.role === ROLES.STUDENT ? '/admin/users/students' : '/admin/users/instructors');
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="divide-y rounded-lg border">
        <Row label="Name">
          {editingName ? (
            <>
              <Input
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveName();
                  } else if (e.key === 'Escape') {
                    setName(user.name);
                    setEditingName(false);
                  }
                }}
                className="h-8 max-w-xs"
              />
              <Button size="sm" variant="ghost" onClick={saveName} disabled={isPending}>
                Save
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button size="sm" variant="ghost" onClick={() => setEditingName(true)}>
                Edit
              </Button>
            </>
          )}
        </Row>

        <Row label="Email">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          {user.emailVerified ? (
            <Badge variant="secondary">Verified</Badge>
          ) : (
            <>
              <Badge variant="outline">Unverified</Badge>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => run(() => adminVerifyEmail(user.id), 'Email marked verified.')}
              >
                Mark verified
              </Button>
            </>
          )}
        </Row>

        <Row label="Role">
          <select
            className={selectClass}
            value={user.role}
            disabled={isSelf || isPending}
            onChange={(e) => run(() => setUserRole(user.id, e.target.value as Role), 'Role updated.')}
            aria-label="Role"
          >
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
        </Row>

        <Row label="Status">
          <Badge variant={user.status === 'ACTIVE' ? 'secondary' : 'destructive'}>
            {user.status === 'ACTIVE' ? 'Active' : 'Suspended'}
          </Badge>
          <Button
            size="sm"
            variant={user.status === 'ACTIVE' ? 'destructive' : 'outline'}
            disabled={isSelf || isPending}
            onClick={() =>
              run(
                () => setUserStatus(user.id, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'),
                user.status === 'ACTIVE' ? 'User suspended.' : 'User reactivated.'
              )
            }
          >
            {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
          </Button>
        </Row>

        <Row label="Two-factor auth">
          {user.twoFactorEnabled ? (
            <>
              <Badge variant="secondary">Enabled</Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => run(() => adminResetTwoFactor(user.id), 'Two-factor reset.')}
              >
                Reset 2FA
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Not enabled</span>
          )}
        </Row>

        <Row label="Account lock">
          {user.locked ? (
            <>
              <Badge variant="destructive">Locked</Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => run(() => adminUnlockAccount(user.id), 'Account unlocked.')}
              >
                Unlock
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Not locked</span>
          )}
        </Row>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Delete this user</p>
          <p className="text-xs text-muted-foreground">
            Permanent. Blocked while they still own courses or enrollments.
          </p>
        </div>
        <Button variant="destructive" size="sm" disabled={isSelf || isPending} onClick={deleteUser}>
          Delete user
        </Button>
      </div>
    </div>
  );
}
