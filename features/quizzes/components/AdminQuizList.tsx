'use client';

import { FileQuestion, Trash2, Pencil, Check, X, ExternalLink } from 'lucide-react';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { deleteQuiz, renameQuiz } from '@/features/quizzes/server/actions';
import type { QuizOverview } from '@/features/quizzes/server/data';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useConfirm } from '@/shared/hooks/use-confirm';

export function AdminQuizList({ quizzes }: { quizzes: QuizOverview[] }) {
  if (quizzes.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        No quizzes have been created yet.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-2xl border border-border/70 bg-card shadow-sm">
      {quizzes.map((quiz) => (
        <QuizListItem key={quiz.id} quiz={quiz} />
      ))}
    </ul>
  );
}

function QuizListItem({ quiz }: { quiz: QuizOverview }) {
  const confirm = useConfirm();
  const [isDeleting, startDelete] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(quiz.title);
  const [isSaving, startSave] = useTransition();

  async function handleRemove() {
    const ok = await confirm({
      title: `Delete "${quiz.title}"?`,
      description: 'This will permanently remove the quiz and its questions.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    startDelete(async () => {
      const result = await deleteQuiz(quiz.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete the quiz.');
        return;
      }
      toast.success('Quiz deleted.');
    });
  }

  async function handleSave() {
    if (!editTitle.trim()) {
      setIsEditing(false);
      setEditTitle(quiz.title);
      return;
    }
    
    startSave(async () => {
      const result = await renameQuiz(quiz.id, editTitle);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not rename the quiz.');
        return;
      }
      toast.success('Quiz renamed.');
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
                  setEditTitle(quiz.title);
                }
              }}
              disabled={isSaving}
            />
            <Button size="icon-sm" variant="ghost" onClick={handleSave} disabled={isSaving}>
              <Check className="size-3.5 text-emerald-500" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setIsEditing(false); setEditTitle(quiz.title); }} disabled={isSaving}>
              <X className="size-3.5 text-rose-500" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-sm leading-snug">{quiz.title}</h3>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{quiz.questionCount} Questions</Badge>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{quiz.passingScore}% Pass</Badge>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span className="truncate font-medium">{quiz.courseTitle}</span>
          {quiz.sectionTitle && <span>·</span>}
          <span className="truncate">{quiz.sectionTitle}</span>
          {quiz.instructorName && (
            <>
              <span>·</span>
              <span className="truncate">By {quiz.instructorName}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          nativeButton={false}
          render={
            <Link href={`/instructor/courses/${quiz.courseId}`}>
              <ExternalLink className="mr-1.5 size-4" /> Edit in Course
            </Link>
          }
        />
        
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
            aria-label="Delete quiz"
          >
            <Trash2 className="size-3.5 text-rose-500/80" />
          </Button>
        </div>
      </div>
    </li>
  );
}
