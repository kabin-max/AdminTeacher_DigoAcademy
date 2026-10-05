'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UploadCloud, Image as ImageIcon, Landmark, Save } from 'lucide-react';
import {
  presignQrUpload,
  updateGlobalQrSettings,
  updateBankSettings,
} from '@/features/settings/server/paymentActions';

interface PaymentSettingsProps {
  paymentQrUrl: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNo: string | null;
  bankBranch: string | null;
}

export function PaymentSettings({
  paymentQrUrl,
  bankName: initBankName,
  bankAccountName: initBankAccountName,
  bankAccountNo: initBankAccountNo,
  bankBranch: initBankBranch,
}: PaymentSettingsProps) {
  // ── QR state ──────────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(paymentQrUrl);

  // ── Bank details state ────────────────────────────────────────────────────
  const [bankName, setBankName] = useState(initBankName ?? '');
  const [bankAccountName, setBankAccountName] = useState(initBankAccountName ?? '');
  const [bankAccountNo, setBankAccountNo] = useState(initBankAccountNo ?? '');
  const [bankBranch, setBankBranch] = useState(initBankBranch ?? '');
  const [isSavingBank, setIsSavingBank] = useState(false);

  // ── QR Upload ─────────────────────────────────────────────────────────────
  const handleSaveQr = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const presign = await presignQrUpload({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      if (!presign.ok || !presign.url || !presign.key) {
        toast.error(presign.error || 'Failed to initialize upload.');
        return;
      }

      const res = await fetch(presign.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!res.ok) {
        toast.error('Failed to upload QR code.');
        return;
      }

      const updateRes = await updateGlobalQrSettings(presign.key);
      if (updateRes.ok) {
        toast.success('QR Code updated successfully!');
        // Show a local preview using object URL (the signed URL is server-side only)
        setCurrentUrl(URL.createObjectURL(file));
        setFile(null);
      } else {
        toast.error(updateRes.error || 'Failed to save settings to database.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Bank Save ─────────────────────────────────────────────────────────────
  const handleSaveBank = async () => {
    setIsSavingBank(true);
    try {
      const result = await updateBankSettings({
        bankName,
        bankAccountName,
        bankAccountNo,
        bankBranch,
      });
      if (result.ok) {
        toast.success('Bank details saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save bank details.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSavingBank(false);
    }
  };

  const inputClass =
    'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50';

  return (
    <div className="space-y-6">
      {/* ── QR Code Section ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="text-lg font-semibold leading-none tracking-tight">Fonepay QR Code</h3>
          <p className="text-sm text-muted-foreground">
            Upload the FonePay QR code image to display during student checkout.
          </p>
        </div>

        <div className="p-6 pt-0 space-y-4">
          <div className="flex items-start gap-6">
            {/* Current QR preview */}
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative shrink-0">
              {currentUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-500 font-medium text-center px-2">No QR Set</span>
              )}
            </div>

            <div className="flex-1">
              <div className="relative mb-4">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploading}
                />
                <div
                  className={`w-full rounded-md border-2 border-dashed p-4 text-center transition-all pointer-events-none ${
                    file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {file ? (
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon className="size-6 text-emerald-500 mb-1" />
                      <span className="text-xs font-semibold text-emerald-700">{file.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <UploadCloud className="size-6 mb-1 text-gray-400" />
                      <span className="text-xs font-medium">Click to browse or drag file</span>
                      <span className="text-[10px] mt-1">(PNG, JPG • max 2 MB)</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveQr}
                disabled={!file || isUploading}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <Save className="size-4" />
                {isUploading ? 'Uploading...' : 'Save QR Code'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bank Transfer Section ────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <div className="flex items-center gap-2">
            <Landmark className="size-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold leading-none tracking-tight">Bank Transfer Details</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            These details are shown to students on the payment/checkout page.
          </p>
        </div>

        <div className="p-6 pt-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bank-name">
                Bank Name
              </label>
              <input
                id="bank-name"
                className={inputClass}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Nepal Bank Limited"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bank-account-name">
                Account Name
              </label>
              <input
                id="bank-account-name"
                className={inputClass}
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="e.g. Digo Academy"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bank-account-no">
                Account Number
              </label>
              <input
                id="bank-account-no"
                className={inputClass}
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="e.g. 01600107100424000001"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bank-branch">
                Branch
              </label>
              <input
                id="bank-branch"
                className={inputClass}
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                placeholder="e.g. Dharan"
              />
            </div>
          </div>

          <button
            onClick={handleSaveBank}
            disabled={isSavingBank}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            <Save className="size-4" />
            {isSavingBank ? 'Saving...' : 'Save Bank Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
