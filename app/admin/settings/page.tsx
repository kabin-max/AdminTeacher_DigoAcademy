import { Settings } from 'lucide-react';

import { GoogleMeetSettings } from '@/features/google-meet/components/GoogleMeetSettings';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { getSettings } from '@/features/settings/server/data';
import { requireRole } from '@/lib/auth/session';
import { isMeetConfigured } from '@/lib/env';
import { getMeetConnection } from '@/lib/meet';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminSettingsPage() {
  await requireRole(ROLES.ADMIN);
  const [values, connection] = await Promise.all([getSettings(), getMeetConnection()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<Settings />}
        title="Platform settings"
        description="Global configuration. Changes take effect immediately and are audited."
      />
      <GoogleMeetSettings
        configured={isMeetConfigured}
        connection={
          connection
            ? { accountEmail: connection.accountEmail, connectedAt: connection.connectedAt.toISOString() }
            : null
        }
      />
      <SettingsForm values={values} />
    </div>
  );
}
