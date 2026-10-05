'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { LessonContentEditor } from '@/features/courses/components/LessonContentEditor';
import { LESSON_TYPES } from '@/features/courses/schemas';
import { addLesson, addSection, deleteLesson, deleteSection, bulkImportCurriculum } from '@/features/courses/server/actions';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

export interface EditorQuizChoice {
  text: string;
  isCorrect: boolean;
}
export interface EditorQuizQuestion {
  prompt: string;
  explanation?: string | null;
  kind: string;
  choices: EditorQuizChoice[];
}
export interface EditorQuiz {
  title: string;
  description?: string | null;
  passingScore: number;
  timeLimitSec?: number | null;
  questions: EditorQuizQuestion[];
}

export interface EditorLesson {
  id: string;
  title: string;
  type: string;
  videoKey?: string | null;
  videoDurationSec?: number | null;
  noteContent?: string | null;
  notePdfKey?: string | null;
  quiz?: EditorQuiz | null;
}
export interface EditorSection {
  id: string;
  title: string;
  lessons: EditorLesson[];
}

/** Short human hint about what content a lesson currently has. */
function contentSummary(lesson: EditorLesson): string {
  if (lesson.type === 'VIDEO') {
    if (!lesson.videoKey) return 'No video yet';
    const mins = lesson.videoDurationSec ? Math.round(lesson.videoDurationSec / 60) : 0;
    const isUrl = lesson.videoKey.startsWith('http');
    const label = isUrl ? 'YouTube' : 'Video';
    return mins > 0 ? `${label} · ${mins} min` : `${label} added`;
  }
  if (lesson.type === 'NOTE') {
    return lesson.noteContent?.trim() || lesson.notePdfKey ? 'Notes added' : 'No notes yet';
  }
  if (lesson.type === 'QUIZ') {
    const count = lesson.quiz?.questions.length ?? 0;
    return count > 0 ? `${count} question${count === 1 ? '' : 's'}` : 'No questions yet';
  }
  return '';
}

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

function AddLessonForm({ sectionId, onDone }: { sectionId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('VIDEO');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    const result = await addLesson(sectionId, { title, type: type as (typeof LESSON_TYPES)[number] });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not add lesson');
      return;
    }
    setTitle('');
    onDone();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New lesson title"
        className="max-w-xs"
      />
      <select className={cn(selectClass)} value={type} onChange={(e) => setType(e.target.value)}>
        {LESSON_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" onClick={submit} disabled={busy || !title.trim()}>
        Add lesson
      </Button>
    </div>
  );
}

export function CurriculumEditor({
  courseId,
  sections,
}: {
  courseId: string;
  sections: EditorSection[];
}) {
  const router = useRouter();
  const [newSection, setNewSection] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [busy, setBusy] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  async function createSection() {
    if (!newSection.trim()) return;
    setBusy(true);
    const result = await addSection(courseId, { title: newSection });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not add section');
      return;
    }
    setNewSection('');
    router.refresh();
  }

  async function handleBulkImport() {
    if (!bulkText.trim()) return;
    setBusy(true);
    const result = await bulkImportCurriculum(courseId, bulkText);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not import curriculum');
      return;
    }
    toast.success('Curriculum imported successfully!');
    setBulkText('');
    router.refresh();
  }

  async function removeSection(id: string) {
    const result = await deleteSection(id);
    if (!result.ok) return toast.error(result.error ?? 'Could not delete');
    router.refresh();
  }

  async function removeLesson(id: string) {
    const result = await deleteLesson(id);
    if (!result.ok) return toast.error(result.error ?? 'Could not delete');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">No sections yet. Add one to start building.</p>
      )}

      {sections.map((section, i) => (
        <div key={section.id} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {i + 1}. {section.title}
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
              Delete section
            </Button>
          </div>

          <ul className="mt-2 divide-y">
            {section.lessons.map((lesson) => {
              const editable =
                lesson.type === 'VIDEO' || lesson.type === 'NOTE' || lesson.type === 'QUIZ';
              const expanded = expandedLessonId === lesson.id;
              return (
                <li key={lesson.id} className="py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <Badge variant="outline">{lesson.type.toLowerCase()}</Badge>
                      <span className="truncate">{lesson.title}</span>
                      {contentSummary(lesson) && (
                        <span className="text-xs text-muted-foreground">
                          · {contentSummary(lesson)}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      {editable && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setExpandedLessonId(expanded ? null : lesson.id)}
                        >
                          {expanded ? 'Close' : 'Edit content'}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => removeLesson(lesson.id)}
                      >
                        Remove
                      </Button>
                    </span>
                  </div>
                  {expanded && editable && (
                    <LessonContentEditor
                      courseId={courseId}
                      lesson={lesson}
                      onSaved={() => {
                        setExpandedLessonId(null);
                        router.refresh();
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <AddLessonForm sectionId={section.id} onDone={() => router.refresh()} />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          placeholder="New section title"
          className="max-w-xs"
        />
        <Button type="button" onClick={createSection} disabled={busy || !newSection.trim()}>
          Add section
        </Button>
      </div>

      <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-border">
        <h3 className="font-semibold text-lg">Bulk Import Syllabus</h3>
        <p className="text-sm text-muted-foreground">
          Paste a syllabus outline here to quickly generate the curriculum. 
          Use normal lines for <strong>Sections</strong>, and lines starting with a hyphen (<code>-</code>) for <strong>Lessons</strong>.
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Introduction\n- Welcome Video\n- Setup Guide\n\nAdvanced Concepts\n- Deep Dive"
          className="min-h-[150px] w-full max-w-2xl rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button type="button" onClick={handleBulkImport} disabled={busy || !bulkText.trim()} className="w-fit">
          Import Syllabus
        </Button>
      </div>
    </div>
  );
}
