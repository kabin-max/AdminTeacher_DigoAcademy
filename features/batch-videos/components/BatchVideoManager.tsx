'use client';

import { PlayCircle, Search, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { createBatchVideo, deleteBatchVideo } from '@/features/batch-videos/server/actions';
import { presignBatchVideoUpload } from '@/features/batch-videos/server/upload';
import type { BatchVideoRow } from '@/features/batch-videos/server/data';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { useConfirm } from '@/shared/hooks/use-confirm';

export function BatchVideoManager({ batchId, videos }: { batchId: string; videos: BatchVideoRow[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => v.title.toLowerCase().includes(q));
  }, [videos, query]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const presign = await presignBatchVideoUpload({
        batchId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
      if (!presign.ok || !presign.url || !presign.key) {
        toast.error(presign.error ?? 'Could not start upload.');
        return;
      }
      const res = await fetch(presign.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!res.ok) {
        toast.error('Upload failed.');
        return;
      }
      const videoTitle = title.trim() || file.name.replace(/\.[^.]+$/, '');
      startSave(async () => {
        const result = await createBatchVideo({ batchId, title: videoTitle, videoKey: presign.key! });
        if (!result.ok) {
          toast.error(result.error ?? 'Could not save the video.');
          return;
        }
        toast.success(`"${videoTitle}" added.`);
        setTitle('');
        setAdding(false);
        router.refresh();
      });
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(video: BatchVideoRow) {
    const ok = await confirm({
      title: `Delete "${video.title}"?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(video.id);
    startDelete(async () => {
      const result = await deleteBatchVideo(video.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete the video.');
        setDeletingId(null);
        return;
      }
      toast.success(`"${video.title}" deleted.`);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Class videos</h2>
        <Button size="sm" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : 'New class video'}
        </Button>
      </div>

      {adding && (
        <div className="flex flex-wrap items-end gap-3 border-b bg-muted/30 px-4 py-4">
          <Field className="min-w-56 flex-1">
            <FieldLabel>Title</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AWS serverless services"
            />
          </Field>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading || isSaving}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {uploading || isSaving ? 'Uploading…' : 'Choose video'}
          </Button>
        </div>
      )}

      <div className="border-b px-4 py-3">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="pl-8"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {videos.length === 0 ? 'No class videos yet.' : 'No videos match your search.'}
        </p>
      ) : (
        <ul className="divide-y">
          {filtered.map((video) => {
            const rowDeleting = isDeleting && deletingId === video.id;
            return (
              <li key={video.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-medium">{video.title}</span>
                <div className="flex shrink-0 items-center gap-3">
                  {video.videoUrl ? (
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <PlayCircle className="size-4" />
                      Watch
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => remove(video)}
                    disabled={rowDeleting}
                    aria-label={`Delete ${video.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
