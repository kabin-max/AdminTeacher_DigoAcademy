'use client';

import { Download, FileUp, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { QUIZ_CSV_TEMPLATE, parseQuizCsv } from '@/features/courses/quiz-import';
import { createStandaloneQuiz } from '@/features/quizzes/server/actions';
import type { CourseOption } from '@/features/quizzes/server/data';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(QUIZ_CSV_TEMPLATE)}`;

export interface QuestionDraft {
  prompt: string;
  explanation: string;
  kind: 'SINGLE' | 'MULTIPLE';
  choices: { text: string; isCorrect: boolean }[];
}

function isEmptyStarter(questions: QuestionDraft[]): boolean {
  return (
    questions.length === 1 &&
    questions[0].prompt.trim() === '' &&
    questions[0].choices.every((c) => c.text.trim() === '')
  );
}

export function CreateQuizModal({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [sectionId, setSectionId] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(80);
  const [timeLimitMin, setTimeLimitMin] = useState<number | undefined>(undefined);

  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      prompt: '',
      explanation: '',
      kind: 'SINGLE',
      choices: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
    },
  ]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  function loadCsv(text: string) {
    const { questions: imported, errors } = parseQuizCsv(text);
    if (imported.length === 0) {
      toast.error(errors[0] ?? 'No questions found in that CSV.');
      return;
    }
    const mapped: QuestionDraft[] = imported.map((q) => ({
      prompt: q.prompt,
      explanation: q.explanation,
      kind: q.kind,
      choices: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })),
    }));
    setQuestions((prev) => (isEmptyStarter(prev) ? mapped : [...prev, ...mapped]));
    toast.success(
      `Imported ${imported.length} question${imported.length === 1 ? '' : 's'}` +
        (errors.length ? ` · ${errors.length} skipped` : '')
    );
    if (errors.length) errors.slice(0, 3).forEach((e) => toast.warning(e));
    setCsvText('');
    setImportOpen(false);
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        prompt: '',
        explanation: '',
        kind: 'SINGLE',
        choices: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
      },
    ]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addChoice(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, choices: [...q.choices, { text: '', isCorrect: false }] } : q
      )
    );
  }

  function removeChoice(qIndex: number, cIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.choices.length <= 2) return q;
        return { ...q, choices: q.choices.filter((_, ci) => ci !== cIndex) };
      })
    );
  }

  function updateChoiceText(qIndex: number, cIndex: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const choices = [...q.choices];
        choices[cIndex] = { ...choices[cIndex]!, text };
        return { ...q, choices };
      })
    );
  }

  function setCorrectChoice(qIndex: number, cIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        if (q.kind === 'SINGLE') {
          return {
            ...q,
            choices: q.choices.map((c, ci) => ({ ...c, isCorrect: ci === cIndex })),
          };
        }
        return {
          ...q,
          choices: q.choices.map((c, ci) => (ci === cIndex ? { ...c, isCorrect: !c.isCorrect } : c)),
        };
      })
    );
  }

  function handleSubmit() {
    if (!courseId) return toast.error('Please select a course.');
    if (!title.trim()) return toast.error('Quiz title is required.');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      if (!q.prompt.trim()) return toast.error(`Question #${i + 1} prompt is empty.`);
      if (q.choices.some((c) => !c.text.trim())) {
        return toast.error(`All choices in Question #${i + 1} must have text.`);
      }
      if (!q.choices.some((c) => c.isCorrect)) {
        return toast.error(`Question #${i + 1} must have at least one correct choice.`);
      }
    }

    startTransition(async () => {
      const res = await createStandaloneQuiz({
        courseId,
        sectionId: sectionId || undefined,
        newSectionTitle: newSectionTitle || undefined,
        title,
        description,
        passingScore,
        timeLimitMin,
        questions,
      });

      if (!res.ok) {
        toast.error(res.error ?? 'Could not create quiz.');
        return;
      }

      toast.success(`Quiz "${title}" created successfully!`);
      setOpen(false);
      setTitle('');
      setDescription('');
      router.refresh();
    });
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Create Quiz
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h2 className="text-xl font-semibold">Create New Standalone Quiz</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the target course and build your quiz questions below.
            </p>

            <div className="mt-6 space-y-4">
              {/* Course Selection */}
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

              {/* Section Selection */}
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
                    placeholder="e.g. Quizzes & Assessments"
                  />
                </Field>
              )}

              {/* Quiz Details */}
              <Field>
                <FieldLabel>Quiz Title</FieldLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Comprehensive Quiz"
                />
              </Field>

              <Field>
                <FieldLabel>Description (Optional)</FieldLabel>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Tests core concepts from Modules 1-3"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Passing Score (%)</FieldLabel>
                  <Input
                    type="number"
                    min={10}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                  />
                </Field>

                <Field>
                  <FieldLabel>Time Limit (Minutes, optional)</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    value={timeLimitMin ?? ''}
                    onChange={(e) =>
                      setTimeLimitMin(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="No limit"
                  />
                </Field>
              </div>

              {/* Bulk CSV Import option */}
              <div className="rounded-xl border border-dashed bg-muted/20 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold">Bulk Import Questions from CSV</span>
                    <p className="text-xs text-muted-foreground">
                      Upload an Excel or CSV file to auto-populate all questions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      nativeButton={false}
                      render={<a href={TEMPLATE_HREF} download="quiz-template.csv" />}
                    >
                      <Download className="size-3.5" />
                      Template
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setImportOpen((v) => !v)}
                    >
                      <FileUp className="size-3.5" />
                      {importOpen ? 'Close' : 'Import CSV'}
                    </Button>
                  </div>
                </div>

                {importOpen && (
                  <div className="mt-3 space-y-3 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void file.text().then(loadCsv);
                            e.target.value = '';
                          }}
                        />
                        <Button type="button" variant="outline" size="xs" nativeButton={false} render={<span />}>
                          <FileUp className="size-3.5" />
                          Upload .csv file
                        </Button>
                      </label>
                      <span className="text-xs text-muted-foreground">or paste CSV code below</span>
                    </div>

                    <Textarea
                      rows={4}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="prompt,type,explanation,choice1,correct1,choice2,correct2,…"
                      className="font-mono text-xs"
                    />

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => loadCsv(csvText)}
                        disabled={!csvText.trim()}
                      >
                        Load Questions
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions Authoring */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Quiz Questions ({questions.length})</h3>
                  <Button type="button" size="xs" variant="outline" onClick={addQuestion}>
                    <Plus className="size-3.5" /> Add Question
                  </Button>
                </div>

                {questions.map((q, qi) => (
                  <div key={qi} className="space-y-3 rounded-xl border p-4 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">Question #{qi + 1}</span>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeQuestion(qi)}
                        >
                          <Trash2 className="size-3.5 text-rose-500" />
                        </Button>
                      )}
                    </div>

                    <Input
                      value={q.prompt}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((item, i) => (i === qi ? { ...item, prompt: e.target.value } : item))
                        )
                      }
                      placeholder="Enter question prompt..."
                    />

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Answer Choices:</p>
                      {q.choices.map((c, ci) => (
                        <div key={ci} className="flex items-center gap-2">
                          <input
                            type={q.kind === 'SINGLE' ? 'radio' : 'checkbox'}
                            name={`q-${qi}`}
                            checked={c.isCorrect}
                            onChange={() => setCorrectChoice(qi, ci)}
                            className="size-4"
                          />
                          <Input
                            value={c.text}
                            onChange={(e) => updateChoiceText(qi, ci, e.target.value)}
                            placeholder={`Choice ${ci + 1}`}
                            className="flex-1"
                          />
                          {q.choices.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() => removeChoice(qi, ci)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => addChoice(qi)}
                      >
                        + Add Choice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={handleSubmit}>
                {isPending ? 'Saving...' : 'Create Quiz'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
