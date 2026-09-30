import { useEffect, useState } from 'react';
import { PlayCircle, Video } from 'lucide-react';
import { toast } from 'sonner';

import { FileUpload } from '@/features/courses/components/FileUpload';
import type { EditorLesson } from '@/features/courses/components/CurriculumEditor';
import { QuizEditor } from '@/features/courses/components/QuizEditor';
import { getLessonVideoPreviewUrl, updateLessonContent } from '@/features/courses/server/actions';
import { RichTextEditor } from '@/shared/components/dashboard/RichTextEditor';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { getYouTubeEmbedUrl } from '@/shared/utils/youtube';

/**
 * Per-lesson content editor. VIDEO lessons get recorded-video upload or YouTube URL
 * input plus live video previewing; NOTE lessons get rich-text notes and optional PDF;
 * QUIZ lessons delegate to the dedicated QuizEditor.
 */
export function LessonContentEditor({
  courseId,
  lesson,
  onSaved,
}: {
  courseId: string;
  lesson: EditorLesson;
  onSaved: () => void;
}) {
  const [videoKey, setVideoKey] = useState(lesson.videoKey ?? '');
  const [videoMode, setVideoMode] = useState<'upload' | 'url'>(
    lesson.videoKey?.startsWith('http') ? 'url' : 'upload'
  );
  const [durationMin, setDurationMin] = useState(
    lesson.videoDurationSec ? (lesson.videoDurationSec / 60).toFixed(1) : ''
  );
  const [noteContent, setNoteContent] = useState(lesson.noteContent ?? '');
  const [notePdfKey, setNotePdfKey] = useState(lesson.notePdfKey ?? '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  function probeDuration(file: File) {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setDurationMin((video.duration / 60).toFixed(1));
      }
    };
    video.onerror = () => URL.revokeObjectURL(url);
    video.src = url;
  }

  async function togglePreview() {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    if (!videoKey) {
      toast.error('No video uploaded or linked yet.');
      return;
    }
    const url = await getLessonVideoPreviewUrl(videoKey);
    if (!url) {
      toast.error('Could not load video preview.');
      return;
    }
    setPreviewUrl(url);
    setShowPreview(true);
  }

  async function save() {
    setBusy(true);
    const minutes = Number.parseFloat(durationMin);
    const videoDurationSec =
      Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : undefined;
    const result = await updateLessonContent(lesson.id, {
      videoKey,
      videoDurationSec,
      noteContent,
      notePdfKey,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not save content.');
      return;
    }
    toast.success('Lesson content saved.');
    onSaved();
  }

  const isVideo = lesson.type === 'VIDEO';
  const isNote = lesson.type === 'NOTE';
  const isAssignment = lesson.type === 'ASSIGNMENT';

  // Quizzes have their own richer authoring surface.
  if (lesson.type === 'QUIZ') {
    return <QuizEditor lesson={lesson} onSaved={onSaved} />;
  }

  const youtubeEmbed = getYouTubeEmbedUrl(previewUrl);

  return (
    <div className="mt-3 space-y-4 rounded-lg border bg-muted/20 p-4">
      {isVideo && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={videoMode === 'upload' ? 'default' : 'outline'}
              size="xs"
              onClick={() => setVideoMode('upload')}
            >
              Upload MP4 / WebM
            </Button>
            <Button
              type="button"
              variant={videoMode === 'url' ? 'default' : 'outline'}
              size="xs"
              onClick={() => setVideoMode('url')}
            >
              Paste YouTube / External Link
            </Button>
          </div>

          {videoMode === 'upload' ? (
            <div>
              <p className="mb-1.5 text-sm font-medium">Recorded video file (S3)</p>
              <FileUpload
                courseId={courseId}
                kind="video"
                accept="video/mp4,video/webm,video/quicktime"
                value={videoKey.startsWith('http') ? '' : videoKey}
                onUploaded={(key) => {
                  setVideoKey(key);
                  setShowPreview(false);
                }}
                onFile={probeDuration}
              />
            </div>
          ) : (
            <div>
              <label htmlFor={`vidurl-${lesson.id}`} className="mb-1.5 block text-sm font-medium">
                YouTube or Video URL
              </label>
              <Input
                id={`vidurl-${lesson.id}`}
                type="url"
                value={videoKey}
                onChange={(e) => {
                  setVideoKey(e.target.value);
                  setShowPreview(false);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Paste any YouTube video link or direct MP4 URL.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-48">
              <label htmlFor={`dur-${lesson.id}`} className="mb-1.5 block text-sm font-medium">
                Duration (minutes)
              </label>
              <Input
                id={`dur-${lesson.id}`}
                type="number"
                min={0}
                step="0.1"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>

            {videoKey && (
              <Button type="button" variant="outline" size="sm" onClick={togglePreview}>
                <PlayCircle className="size-4" />
                {showPreview ? 'Hide preview' : 'Preview video'}
              </Button>
            )}
          </div>

          {showPreview && previewUrl && (
            <div className="overflow-hidden rounded-xl border bg-black shadow-sm">
              {youtubeEmbed ? (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={youtubeEmbed}
                    title="Video preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="size-full border-0"
                  />
                </div>
              ) : (
                <video controls src={previewUrl} className="aspect-video w-full" />
              )}
            </div>
          )}
        </div>
      )}

      {isNote && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-sm font-medium">Notes</p>
            <RichTextEditor
              value={noteContent}
              onChange={setNoteContent}
              placeholder="Write lesson notes…"
              aria-label="Lesson notes"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Attach a PDF (optional)</p>
            <FileUpload
              courseId={courseId}
              kind="pdf"
              accept="application/pdf"
              value={notePdfKey}
              onUploaded={setNotePdfKey}
            />
          </div>
        </div>
      )}

      {isAssignment && (
        <p className="text-sm text-muted-foreground">
          Assignment content is set up in the assignments step (coming soon).
        </p>
      )}

      {!isAssignment && (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save content'}
          </Button>
        </div>
      )}
    </div>
  );
}
