import { Settings } from 'lucide-react';

import { GoogleMeetSettings } from '@/features/google-meet/components/GoogleMeetSettings';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { PaymentSettings } from '@/features/settings/components/PaymentSettings';
import { PopupBannerSettings } from '@/features/settings/components/PopupBannerSettings';
import { getSettings } from '@/features/settings/server/data';
import { requireRole } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { isMeetConfigured, isS3Configured } from '@/lib/env';
import { getMeetConnection } from '@/lib/meet';
import { presignDownload } from '@/lib/storage';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminSettingsPage() {
  await requireRole(ROLES.ADMIN);
  const [values, connection, globalSettings] = await Promise.all([
    getSettings(),
    getMeetConnection(),
    db.globalSettings.findUnique({ where: { id: 'singleton' } }),
  ]);

  // Resolve the stored S3 key to a short-lived signed URL for the preview image.
  let qrPreviewUrl: string | null = globalSettings?.paymentQrUrl ?? null;
  let popupImagePreviewUrl: string | null = null;
  const popupImageKey = typeof values['home.popup.imageKey'] === 'string' ? values['home.popup.imageKey'] : null;

  if (isS3Configured) {
    try {
      if (qrPreviewUrl) qrPreviewUrl = await presignDownload(qrPreviewUrl);
      if (popupImageKey) popupImagePreviewUrl = await presignDownload(popupImageKey);
    } catch {
      qrPreviewUrl = null;
      popupImagePreviewUrl = null;
    }
  }

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
      <PopupBannerSettings initialImageUrl={popupImagePreviewUrl} />
      <PaymentSettings
        paymentQrUrl={qrPreviewUrl}
        bankName={globalSettings?.bankName ?? null}
        bankAccountName={globalSettings?.bankAccountName ?? null}
        bankAccountNo={globalSettings?.bankAccountNo ?? null}
        bankBranch={globalSettings?.bankBranch ?? null}
      />
    </div>
  );
}
