'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { FileUpload } from '@/features/courses/components/FileUpload';
import { createStandaloneVideo } from '@/features/videos/server/actions';
import type { BatchOption, CourseOptionWithSections } from '@/features/videos/server/data';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';

export function CreateVideoModal({
  courses,
  batches,
}: {
  courses: CourseOptionWithSections[];
  batches: BatchOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [targetType, setTargetType] = useState<'BATCH' | 'COURSE'>('BATCH');
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [sectionId, setSectionId] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [title, setTitle] = useState('');
  const [videoMode, setVideoMode] = useState<'upload' | 'url'>('upload');
  const [videoKey, setVideoKey] = useState('');
  const [durationMin, setDurationMin] = useState<number | undefined>(undefined);

  const selectedCourse = courses.find((c) => c.id === courseId);

  function probeDuration(file: File) {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setDurationMin(Number((video.duration / 60).toFixed(1)));
      }
    };
    video.onerror = () => URL.revokeObjectURL(url);
    video.src = url;
  }

  function handleSubmit() {
    if (!title.trim()) return toast.error('Video title is required.');
    if (!videoKey.trim()) return toast.error('Please upload a video or paste a video link.');

    if (targetType === 'BATCH' && !batchId) return toast.error('Please select a batch.');
    if (targetType === 'COURSE' && !courseId) return toast.error('Please select a course.');

    startTransition(async () => {
      const res = await createStandaloneVideo({
        targetType,
        batchId: targetType === 'BATCH' ? batchId : undefined,
        courseId: targetType === 'COURSE' ? courseId : undefined,
        sectionId: targetType === 'COURSE' ? sectionId || undefined : undefined,
        newSectionTitle: targetType === 'COURSE' ? newSectionTitle || undefined : undefined,
        title,
        videoKey,
        durationMin,
      });

      if (!res.ok) {
        toast.error(res.error ?? 'Could not save video.');
        return;
      }

      toast.success(`Video "${title}" created successfully!`);
      setOpen(false);
      setTitle('');
      setVideoKey('');
      router.refresh();
    });
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Class Video
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h2 className="text-xl font-semibold">Upload / Link New Video</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a recorded video to a Batch or Course.
            </p>

            <div className="mt-6 space-y-4">
              {/* Target Type Selector */}
              <Field>
                <FieldLabel>Attach Video To</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={targetType === 'BATCH' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTargetType('BATCH')}
                  >
                    Live Batch
                  </Button>
                  <Button
                    type="button"
                    variant={targetType === 'COURSE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTargetType('COURSE')}
                  >
                    Self-Paced Course
                  </Button>
                </div>
              </Field>

              {/* Batch Selector */}
              {targetType === 'BATCH' && (
                <Field>
                  <FieldLabel>Select Batch</FieldLabel>
                  {batches.length === 0 ? (
                    <p className="text-xs text-rose-500">No batches assigned yet.</p>
                  ) : (
                    <select
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full rounded-lg border bg-transparent p-2 text-sm"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.courseTitle})
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              )}

              {/* Course Selector */}
              {targetType === 'COURSE' && (
                <>
                  <Field>
                    <FieldLabel>Select Course</FieldLabel>
                    <select
                      value={courseId}
                      onChange={(e) => {
                        setCourseId(e.target.value);
                        setSectionId('');
                      }}
                      className="w-full rounded-lg border bg-transparent p-2 text-sm"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel>Section (Module)</FieldLabel>
                    <select
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                      className="w-full rounded-lg border bg-transparent p-2 text-sm"
                    >
                      <option value="">+ Create New Section...</option>
                      {selectedCourse?.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {!sectionId && (
                    <Field>
                      <FieldLabel>New Section Title</FieldLabel>
                      <Input
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        placeholder="e.g. Class Recordings"
                      />
                    </Field>
                  )}
                </>
              )}

              {/* Video Title */}
              <Field>
                <FieldLabel>Video Title</FieldLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Session 1: Introduction to Architecture"
                />
              </Field>

              {/* Video Upload or Link */}
              <Field>
                <FieldLabel>Video Source</FieldLabel>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={videoMode === 'upload' ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setVideoMode('upload')}
                  >
                    Upload S3 File
                  </Button>
                  <Button
                    type="button"
                    variant={videoMode === 'url' ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setVideoMode('url')}
                  >
                    Paste YouTube Link
                  </Button>
                </div>

                {videoMode === 'upload' ? (
                  <FileUpload
                    courseId={courseId || 'general'}
                    kind="video"
                    accept="video/mp4,video/webm,video/quicktime"
                    value={videoKey.startsWith('http') ? '' : videoKey}
                    onUploaded={setVideoKey}
                    onFile={probeDuration}
                  />
                ) : (
                  <Input
                    type="url"
                    value={videoKey}
                    onChange={(e) => setVideoKey(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                )}
              </Field>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={handleSubmit}>
                {isPending ? 'Saving...' : 'Save Video'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
