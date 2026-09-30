'use client';

import { Download, FileUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { EditorLesson } from '@/features/courses/components/CurriculumEditor';
import { QUIZ_CSV_TEMPLATE, parseQuizCsv } from '@/features/courses/quiz-import';
import { QUESTION_KINDS, type QuestionKind, type QuizInput } from '@/features/courses/schemas';
import { upsertQuiz } from '@/features/courses/server/actions';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';

interface Choice {
  text: string;
  isCorrect: boolean;
}
interface Question {
  prompt: string;
  explanation: string;
  kind: QuestionKind;
  choices: Choice[];
}

const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(QUIZ_CSV_TEMPLATE)}`;

const KIND_LABELS: Record<QuestionKind, string> = {
  SINGLE: 'Single answer (radio)',
  MULTIPLE: 'Multiple answers (checkbox)',
};

const selectClass =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

function newChoice(): Choice {
  return { text: '', isCorrect: false };
}
function newQuestion(): Question {
  return { prompt: '', explanation: '', kind: 'SINGLE', choices: [newChoice(), newChoice()] };
}

function initialQuestions(lesson: EditorLesson): Question[] {
  const existing = lesson.quiz?.questions;
  if (!existing || existing.length === 0) return [newQuestion()];
  return existing.map((q) => ({
    prompt: q.prompt,
    explanation: q.explanation ?? '',
    kind: (q.kind === 'MULTIPLE' ? 'MULTIPLE' : 'SINGLE') as QuestionKind,
    choices: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })),
  }));
}

function isEmptyStarter(questions: Question[]): boolean {
  return (
    questions.length === 1 &&
    questions[0].prompt.trim() === '' &&
    questions[0].choices.every((c) => c.text.trim() === '')
  );
}

/**
 * Authoring UI for a QUIZ lesson: quiz settings plus a list of questions, each
 * either single-answer (radio) or multiple-answer (checkbox). Persists via the
 * `upsertQuiz` server action, which re-checks ownership and validates.
 */
export function QuizEditor({
  lesson,
  onSaved,
}: {
  lesson: EditorLesson;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(lesson.quiz?.title ?? lesson.title ?? '');
  const [description, setDescription] = useState(lesson.quiz?.description ?? '');
  const [passingScore, setPassingScore] = useState(String(lesson.quiz?.passingScore ?? 60));
  const [timeLimitMin, setTimeLimitMin] = useState(
    lesson.quiz?.timeLimitSec ? String(Math.round(lesson.quiz.timeLimitSec / 60)) : ''
  );
  const [questions, setQuestions] = useState<Question[]>(() => initialQuestions(lesson));
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  function updateQuestion(qi: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }

  function loadCsv(text: string) {
    const { questions: imported, errors } = parseQuizCsv(text);
    if (imported.length === 0) {
      toast.error(errors[0] ?? 'No questions found in that CSV.');
      return;
    }
    const mapped: Question[] = imported.map((q) => ({
      prompt: q.prompt,
      explanation: q.explanation,
      kind: q.kind,
      choices: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })),
    }));
    // Replace the blank starter, otherwise append to what's there.
    setQuestions((prev) => (isEmptyStarter(prev) ? mapped : [...prev, ...mapped]));
    toast.success(
      `Imported ${imported.length} question${imported.length === 1 ? '' : 's'}` +
        (errors.length ? ` · ${errors.length} skipped` : '') +
        '. Review, then Save quiz.'
    );
    if (errors.length) errors.slice(0, 3).forEach((e) => toast.warning(e));
    setCsvText('');
    setImportOpen(false);
  }

  function changeKind(qi: number, kind: QuestionKind) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        // Switching to single-answer: keep only the first correct choice.
        if (kind === 'SINGLE') {
          let seen = false;
          const choices = q.choices.map((c) => {
            if (c.isCorrect && !seen) {
              seen = true;
              return c;
            }
            return { ...c, isCorrect: false };
          });
          return { ...q, kind, choices };
        }
        return { ...q, kind };
      })
    );
  }

  function toggleCorrect(qi: number, ci: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const choices = q.choices.map((c, j) => {
          if (q.kind === 'SINGLE') return { ...c, isCorrect: j === ci };
          return j === ci ? { ...c, isCorrect: !c.isCorrect } : c;
        });
        return { ...q, choices };
      })
    );
  }

  function updateChoiceText(qi: number, ci: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? { ...q, choices: q.choices.map((c, j) => (j === ci ? { ...c, text } : c)) }
          : q
      )
    );
  }

  function addChoice(qi: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi && q.choices.length < 10 ? { ...q, choices: [...q.choices, newChoice()] } : q
      )
    );
  }

  function removeChoice(qi: number, ci: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi && q.choices.length > 2
          ? { ...q, choices: q.choices.filter((_, j) => j !== ci) }
          : q
      )
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, newQuestion()]);
  }

  function removeQuestion(qi: number) {
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== qi) : prev));
  }

  async function save() {
    const minutes = Number.parseFloat(timeLimitMin);
    const payload: QuizInput = {
      title: title.trim(),
      description,
      passingScore: Number.parseInt(passingScore || '0', 10) || 0,
      timeLimitSec:
        timeLimitMin.trim() && Number.isFinite(minutes) && minutes > 0
          ? Math.round(minutes * 60)
          : undefined,
      questions: questions.map((q) => ({
        prompt: q.prompt.trim(),
        explanation: q.explanation.trim(),
        kind: q.kind,
        choices: q.choices.map((c) => ({ text: c.text.trim(), isCorrect: c.isCorrect })),
      })),
    };

    setBusy(true);
    const result = await upsertQuiz(lesson.id, payload);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not save quiz.');
      return;
    }
    toast.success('Quiz saved.');
    onSaved();
  }

  return (
    <div className="mt-3 space-y-4 rounded-lg border bg-muted/20 p-4">
      {/* Quiz settings */}
      <div className="space-y-3">
        <div>
          <label htmlFor={`quiz-title-${lesson.id}`} className="mb-1.5 block text-sm font-medium">
            Quiz title
          </label>
          <Input
            id={`quiz-title-${lesson.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Module 1 knowledge check"
          />
        </div>
        <div>
          <label htmlFor={`quiz-desc-${lesson.id}`} className="mb-1.5 block text-sm font-medium">
            Description (optional)
          </label>
          <Textarea
            id={`quiz-desc-${lesson.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions shown before the quiz starts…"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`quiz-pass-${lesson.id}`} className="mb-1.5 block text-sm font-medium">
              Passing score (%)
            </label>
            <Input
              id={`quiz-pass-${lesson.id}`}
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`quiz-time-${lesson.id}`} className="mb-1.5 block text-sm font-medium">
              Time limit (minutes, optional)
            </label>
            <Input
              id={`quiz-time-${lesson.id}`}
              type="number"
              min={0}
              value={timeLimitMin}
              onChange={(e) => setTimeLimitMin(e.target.value)}
              placeholder="No limit"
            />
          </div>
        </div>
      </div>

      {/* Bulk import from CSV */}
      <div className="rounded-lg border border-dashed bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-sm font-medium">Import questions from a spreadsheet</span>
            <p className="text-xs text-muted-foreground">
              Fill the CSV template in Excel or Google Sheets — one row per question.
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
              <Download />
              Template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setImportOpen((open) => !open)}
            >
              <FileUp />
              {importOpen ? 'Close' : 'Import CSV'}
            </Button>
          </div>
        </div>

        {importOpen && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) file.text().then(loadCsv);
                    e.target.value = '';
                  }}
                />
                <Button type="button" variant="outline" size="xs" nativeButton={false} render={<span />}>
                  <FileUp />
                  Upload .csv
                </Button>
              </label>
              <span className="text-xs text-muted-foreground">or paste CSV below</span>
            </div>
            <Textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="prompt,type,explanation,choice1,correct1,choice2,correct2,…"
              className="font-mono text-xs"
            />
            <div className="flex justify-end">
              <Button type="button" size="xs" onClick={() => loadCsv(csvText)} disabled={!csvText.trim()}>
                Load questions
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((question, qi) => (
          <div key={qi} className="space-y-3 rounded-lg border bg-card p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 text-sm font-medium text-muted-foreground">Q{qi + 1}</span>
              <Input
                value={question.prompt}
                onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                placeholder="Question prompt"
                className="flex-1"
              />
              <select
                aria-label="Answer type"
                className={cn(selectClass, 'mt-0.5')}
                value={question.kind}
                onChange={(e) => changeKind(qi, e.target.value as QuestionKind)}
              >
                {QUESTION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                aria-label="Remove question"
                className="mt-1 text-destructive hover:text-destructive"
                onClick={() => removeQuestion(qi)}
                disabled={questions.length <= 1}
              >
                <Trash2 />
              </Button>
            </div>

            <ul className="space-y-2 pl-6">
              {question.choices.map((choice, ci) => (
                <li key={ci} className="flex items-center gap-2">
                  <input
                    type={question.kind === 'SINGLE' ? 'radio' : 'checkbox'}
                    name={`correct-${lesson.id}-${qi}`}
                    aria-label={`Mark choice ${ci + 1} correct`}
                    className="size-4 shrink-0 accent-primary"
                    checked={choice.isCorrect}
                    onChange={() => toggleCorrect(qi, ci)}
                  />
                  <Input
                    value={choice.text}
                    onChange={(e) => updateChoiceText(qi, ci, e.target.value)}
                    placeholder={`Choice ${ci + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    aria-label="Remove choice"
                    onClick={() => removeChoice(qi, ci)}
                    disabled={question.choices.length <= 2}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>

            <div className="pl-6">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => addChoice(qi)}
                disabled={question.choices.length >= 10}
              >
                <Plus />
                Add choice
              </Button>
            </div>

            <div className="pl-6">
              <label
                htmlFor={`quiz-expl-${lesson.id}-${qi}`}
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Explanation (optional) — shown after the learner answers
              </label>
              <Textarea
                id={`quiz-expl-${lesson.id}-${qi}`}
                value={question.explanation}
                onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                rows={2}
                placeholder="Why the correct answer is correct…"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus />
          Add question
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save quiz'}
        </Button>
      </div>
    </div>
  );
}
