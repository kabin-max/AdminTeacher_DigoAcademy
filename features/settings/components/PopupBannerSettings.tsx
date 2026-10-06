'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UploadCloud, Image as ImageIcon, Save, Presentation } from 'lucide-react';
import { updateSetting } from '@/features/settings/server/actions';
import { presignPopupBannerUpload } from '@/features/settings/server/popupActions';

interface PopupBannerSettingsProps {
  initialImageUrl: string | null;
}

export function PopupBannerSettings({ initialImageUrl }: PopupBannerSettingsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialImageUrl);

  const handleSaveImage = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const presign = await presignPopupBannerUpload({
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
        toast.error('Failed to upload image.');
        return;
      }

      const updateRes = await updateSetting('home.popup.imageKey', presign.key);
      if (updateRes.ok) {
        toast.success('Popup image updated successfully!');
        setCurrentUrl(URL.createObjectURL(file));
        setFile(null);
      } else {
        toast.error(updateRes.error || 'Failed to save settings.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm mt-6">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <div className="flex items-center gap-2">
          <Presentation className="size-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold leading-none tracking-tight">Home Page Popup Banner</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload an image banner to be displayed as a popup on the home page.
        </p>
      </div>

      <div className="p-6 pt-0 space-y-4">
        <div className="flex items-start gap-6">
          <div className="w-64 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative shrink-0">
            {currentUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUrl} alt="Popup Banner" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-500 font-medium text-center px-2">No Image Set</span>
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
                    <span className="text-[10px] mt-1">(PNG, JPG • max 5 MB)</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveImage}
              disabled={!file || isUploading}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
            >
              <Save className="size-4" />
              {isUploading ? 'Uploading...' : 'Save Banner Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
