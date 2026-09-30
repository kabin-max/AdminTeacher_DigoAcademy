'use client';

import { FileUp, Loader2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  isValidQuestion,
  moduleLessons,
  type CourseDraft,
} from '@/features/course-import/parse';
import { importCourseDraft, parseCourseUpload } from '@/features/course-import/server/actions';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

const TEMPLATE_HREF = '/admin/courses/import/template';

function summarize(draft: CourseDraft) {
  let lessons = 0;
  let questions = 0;
  let importable = 0;
  for (const mod of draft.modules) {
    lessons += moduleLessons(mod).length;
    questions += mod.questions.length;
    importable += mod.questions.filter(isValidQuestion).length;
  }
  return { modules: draft.modules.length, lessons, questions, importable };
}

export function CourseImporter() {
  const router = useRouter();
  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [busy, setBusy] = useState<'analyze' | 'import' | null>(null);

  async function analyze(file: File) {
    setBusy('analyze');
    const fd = new FormData();
    fd.append('file', file);
    const result = await parseCourseUpload(fd);
    setBusy(null);
    if (!result.ok || !result.draft) {
      toast.error(result.error ?? 'Could not read that document.');
      return;
    }
    setDraft(result.draft);
    toast.success(`Parsed ${result.draft.modules.length} modules.`);
  }

  async function runImport() {
    if (!draft) return;
    setBusy('import');
    const result = await importCourseDraft(draft);
    setBusy(null);
    if (!result.ok || !result.courseId) {
      toast.error(result.error ?? 'Import failed.');
      return;
    }
    toast.success('Course imported as a draft.');
    router.push(`/admin/courses/${result.courseId}`);
  }

  if (!draft) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
            <FileUp className="size-6" />
          </span>
          <div>
            <p className="font-medium">Upload a course document</p>
            <p className="text-sm text-muted-foreground">
              A Word <code>.docx</code> with modules, objectives, topics, activities and knowledge
              checks. It’s imported as a reviewable draft.
            </p>
          </div>
          <label>
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              disabled={busy !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) analyze(file);
                e.target.value = '';
              }}
            />
            <Button nativeButton={false} render={<span />} disabled={busy !== null}>
              {busy === 'analyze' ? <Loader2 className="animate-spin" /> : <Upload />}
              {busy === 'analyze' ? 'Analyzing…' : 'Choose .docx'}
            </Button>
          </label>
          <a
            href={TEMPLATE_HREF}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Not sure of the format? Download the template
          </a>
        </CardContent>
      </Card>
    );
  }

  const stats = summarize(draft);
  const dropped = stats.questions - stats.importable;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{draft.title}</CardTitle>
          {draft.description && (
            <p className="text-sm text-muted-foreground">{draft.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{stats.modules} modules</Badge>
            <Badge variant="secondary">{stats.lessons} lessons</Badge>
            <Badge variant="secondary">{stats.importable} quiz questions</Badge>
            {dropped > 0 && <Badge variant="outline">{dropped} skipped (malformed)</Badge>}
          </div>

          <ul className="divide-y rounded-lg border">
            {draft.modules.map((mod, mi) => {
              const lessons = moduleLessons(mod);
              const questions = mod.questions.filter(isValidQuestion).length;
              return (
                <li key={mi} className="px-4 py-2.5">
                  <div className="text-sm font-medium">
                    Module {String(mi + 1).padStart(2, '0')} · {mod.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lessons.map((l) => l.title).join(' · ')}
                    {questions > 0 ? ` · ${questions} questions` : ''}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={runImport} disabled={busy !== null}>
          {busy === 'import' ? <Loader2 className="animate-spin" /> : <Upload />}
          {busy === 'import' ? 'Importing…' : 'Import as draft course'}
        </Button>
        <Button variant="outline" onClick={() => setDraft(null)} disabled={busy !== null}>
          Choose another file
        </Button>
      </div>
    </div>
  );
}
