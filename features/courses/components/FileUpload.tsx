'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { presignCourseUpload, type UploadKind } from '@/features/courses/server/upload';
import { Button } from '@/shared/components/ui/button';

export function FileUpload({
  courseId,
  kind,
  accept,
  value,
  onUploaded,
  onFile,
}: {
  courseId: string;
  kind: UploadKind;
  accept: string;
  /** Current stored key, if any. */
  value?: string;
  onUploaded: (key: string) => void;
  /** Called with the selected File before upload (e.g. to probe video duration). */
  onFile?: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    onFile?.(file);
    setBusy(true);
    try {
      const presign = await presignCourseUpload({
        courseId,
        kind,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
      if (!presign.ok || !presign.url || !presign.key) {
        toast.error(presign.error ?? 'Could not start upload');
        return;
      }

      const res = await fetch(presign.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error('Upload PUT failed:', res.status, res.statusText, errorText);
        toast.error(`Upload failed (${res.status}: ${res.statusText || 'check Supabase bucket/CORS'})`);
        return;
      }

      onUploaded(presign.key);
      toast.success('File uploaded! Remember to click "Save details" below.');
    } catch (err) {
      console.error('Upload network error:', err);
      toast.error('Upload failed. Check browser console for CORS/network errors.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const currentName = value ? value.split('/').pop() : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Uploading…' : value ? 'Replace file' : 'Upload file'}
      </Button>
      <span className="truncate text-xs text-muted-foreground">
        {currentName ? `Stored: ${currentName}` : 'No file uploaded'}
      </span>
    </div>
  );
}
