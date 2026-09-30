'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  createCategory,
  deleteCategory,
  renameCategory,
} from '@/features/categories/server/actions';
import { categoryNameSchema } from '@/features/categories/schemas';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { useConfirm } from '@/shared/hooks/use-confirm';
import { cn } from '@/shared/utils/cn';

interface ManagerLeaf {
  id: string;
  name: string;
  courseCount: number;
}
interface ManagerNode extends ManagerLeaf {
  children: ManagerLeaf[];
}

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export function CategoryManager({ tree }: { tree: ManagerNode[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [parentId, setParentId] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const trimmed = name.trim();
    const parsed = categoryNameSchema.safeParse(trimmed);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message);
      return;
    }
    setNameError(undefined);
    startTransition(async () => {
      const result = await createCategory({ name: trimmed, parentId });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not add category.');
        return;
      }
      toast.success(`Category "${trimmed}" added.`);
      setName('');
      setParentId('');
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium">Add a category</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Leave the parent as “Top-level” for a main category, or pick a parent to add a
          subcategory (e.g. AWS → AWS Cloud Practitioner).
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field data-invalid={!!nameError}>
            <FieldLabel htmlFor="cat-name">Name</FieldLabel>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(undefined);
              }}
              placeholder="e.g. AWS Cloud Practitioner"
              aria-invalid={!!nameError}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <FieldError>{nameError}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="cat-parent">Parent</FieldLabel>
            <select
              id="cat-parent"
              className={cn(selectClass)}
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Top-level category</option>
              {tree.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </Field>
          <Button type="button" onClick={handleAdd} disabled={isPending} className="w-fit">
            {isPending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </div>

      {tree.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet. Add your first above.</p>
      ) : (
        <ul className="space-y-2">
          {tree.map((node) => (
            <li key={node.id} className="rounded-lg border">
              <CategoryRow node={node} isParent />
              {node.children.length > 0 && (
                <ul className="border-t">
                  {node.children.map((child) => (
                    <li key={child.id} className="border-b last:border-b-0 pl-6">
                      <CategoryRow node={child} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({ node, isParent = false }: { node: ManagerLeaf; isParent?: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);
  const [draftError, setDraftError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function save() {
    const trimmed = draft.trim();
    if (trimmed === node.name) {
      setEditing(false);
      return;
    }
    const parsed = categoryNameSchema.safeParse(trimmed);
    if (!parsed.success) {
      setDraftError(parsed.error.issues[0]?.message);
      return;
    }
    setDraftError(undefined);
    startTransition(async () => {
      const result = await renameCategory(node.id, { name: trimmed });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not rename.');
        return;
      }
      toast.success(`Category renamed to "${trimmed}".`);
      setEditing(false);
      router.refresh();
    });
  }

  async function remove() {
    const ok = await confirm({
      title: `Delete "${node.name}"?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteCategory(node.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete category.');
        return;
      }
      toast.success(`Category "${node.name}" deleted.`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      {editing ? (
        <div className="flex flex-col gap-1">
          <Input
            value={draft}
            autoFocus
            aria-invalid={!!draftError}
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                save();
              } else if (e.key === 'Escape') {
                setDraft(node.name);
                setDraftError(undefined);
                setEditing(false);
              }
            }}
            className="max-w-xs"
          />
          <FieldError>{draftError}</FieldError>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={cn('text-sm', isParent && 'font-medium')}>{node.name}</span>
          {node.courseCount > 0 && (
            <Badge variant="secondary">
              {node.courseCount} course{node.courseCount === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <Button size="sm" variant="ghost" onClick={save} disabled={isPending}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(node.name);
                setDraftError(undefined);
                setEditing(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(node.name);
                setDraftError(undefined);
                setEditing(true);
              }}
              disabled={isPending}
            >
              Rename
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={remove}
              disabled={isPending}
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
