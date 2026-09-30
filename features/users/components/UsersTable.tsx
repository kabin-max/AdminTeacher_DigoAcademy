'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { setUserRole, setUserStatus } from '@/features/users/server/actions';
import { StatusPill } from '@/shared/components/dashboard/StatusPill';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ROLES, type Role } from '@/shared/constants/roles';
import { useConfirm } from '@/shared/hooks/use-confirm';
import { cn } from '@/shared/utils/cn';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

const selectClass =
  'h-8 rounded-lg border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50';

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();

  function changeRole(user: UserRow, role: Role) {
    if (role === user.role) return;
    startTransition(async () => {
      const result = await setUserRole(user.id, role);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not update role.');
        return;
      }
      toast.success(`${user.name} is now ${ROLE_LABELS[role]}.`);
      router.refresh();
    });
  }

  async function toggleStatus(user: UserRow) {
    const next = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (next === 'SUSPENDED') {
      const ok = await confirm({
        title: `Suspend ${user.name}?`,
        description: 'They will be signed out and unable to sign back in until reactivated.',
        confirmLabel: 'Suspend',
        destructive: true,
      });
      if (!ok) return;
    }
    startTransition(async () => {
      const result = await setUserStatus(user.id, next);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not update status.');
        return;
      }
      toast.success(next === 'SUSPENDED' ? `${user.name} suspended.` : `${user.name} reactivated.`);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <tr
                key={user.id}
                className={cn(
                  'transition-colors hover:bg-muted/30',
                  user.status === 'SUSPENDED' && 'opacity-60'
                )}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {user.name}
                    </Link>
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{user.email}</span>
                    {!user.emailVerified && <Badge variant="outline">Unverified</Badge>}
                    {user.twoFactorEnabled && <Badge variant="secondary">2FA</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    className={selectClass}
                    value={user.role}
                    disabled={isSelf || isPending}
                    onChange={(e) => changeRole(user, e.target.value as Role)}
                    aria-label={`Role for ${user.name}`}
                  >
                    {Object.values(ROLES).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={user.status === 'ACTIVE' ? 'success' : 'danger'} dot>
                    {user.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                  </StatusPill>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant={user.status === 'ACTIVE' ? 'destructive' : 'outline'}
                    disabled={isSelf || isPending}
                    onClick={() => toggleStatus(user)}
                  >
                    {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
