import { ScrollText } from 'lucide-react';

import { getAuditLog } from '@/features/audit/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Badge } from '@/shared/components/ui/badge';
import { ROLES } from '@/shared/constants/roles';

function summarize(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object') return '';
  return Object.entries(metadata as Record<string, unknown>)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

export default async function AdminAuditPage() {
  await requireRole(ROLES.ADMIN);
  const entries = await getAuditLog();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<ScrollText />}
        title="Audit log"
        description={`Latest ${entries.length} consequential action${entries.length === 1 ? '' : 's'} across the platform.`}
      />

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Badge variant="outline">{entry.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.entityType}
                    {entry.entityId ? (
                      <span className="text-xs"> · {entry.entityId.slice(0, 8)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.actor?.name ?? 'System'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {summarize(entry.metadata)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {entry.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
