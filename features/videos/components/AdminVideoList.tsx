'use client';

import { PlayCircle, Trash2, Pencil, Check, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteVideo, renameVideo } from '@/features/videos/server/actions';
import type { VideoOverview } from '@/features/videos/server/data';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useConfirm } from '@/shared/hooks/use-confirm';

export function AdminVideoList({ videos }: { videos: VideoOverview[] }) {
  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        No class recordings or video lessons have been uploaded yet.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-2xl border border-border/70 bg-card shadow-sm">
      {videos.map((video) => (
        <VideoListItem key={video.id} video={video} />
      ))}
    </ul>
  );
}

function VideoListItem({ video }: { video: VideoOverview }) {
  const confirm = useConfirm();
  const [isDeleting, startDelete] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);
  const [isSaving, startSave] = useTransition();

  async function handleRemove() {
    const ok = await confirm({
      title: `Delete "${video.title}"?`,
      description: 'This will permanently remove the video.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    startDelete(async () => {
      const result = await deleteVideo(video.id, video.type);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete the video.');
        return;
      }
      toast.success('Video deleted.');
    });
  }

  async function handleSave() {
    if (!editTitle.trim()) {
      setIsEditing(false);
      setEditTitle(video.title);
      return;
    }
    
    startSave(async () => {
      const result = await renameVideo(video.id, video.type, editTitle);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not rename the video.');
        return;
      }
      toast.success('Video renamed.');
      setIsEditing(false);
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSave();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditTitle(video.title);
                }
              }}
              disabled={isSaving}
            />
            <Button size="icon-sm" variant="ghost" onClick={handleSave} disabled={isSaving}>
              <Check className="size-3.5 text-emerald-500" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setIsEditing(false); setEditTitle(video.title); }} disabled={isSaving}>
              <X className="size-3.5 text-rose-500" />
            </Button>
          </div>
        ) : (
          <h3 className="truncate font-medium text-sm leading-snug">{video.title}</h3>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{video.type}</Badge>
          <span className="truncate font-medium">{video.courseTitle}</span>
          {(video.batchName || video.sectionTitle) && <span>·</span>}
          <span className="truncate">{video.batchName ?? video.sectionTitle}</span>
          {video.instructorName && (
            <>
              <span>·</span>
              <span className="truncate">By {video.instructorName}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex shrink-0 items-center gap-2">
        {video.videoUrl ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            nativeButton={false}
            render={
              <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="mr-1.5 size-4" /> Watch
              </a>
            }
          />
        ) : (
          <span className="text-xs text-muted-foreground px-2">Unavailable</span>
        )}
        
        <div className="flex items-center ml-2 space-x-1 border-l pl-2">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            disabled={isDeleting || isSaving || isEditing}
            aria-label="Edit title"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={isDeleting || isSaving || isEditing}
            aria-label="Delete video"
          >
            <Trash2 className="size-3.5 text-rose-500/80" />
          </Button>
        </div>
      </div>
    </li>
  );
}
