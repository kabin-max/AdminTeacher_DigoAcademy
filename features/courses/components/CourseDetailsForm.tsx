'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  courseDetailsSchema,
  DIFFICULTIES,
  type CourseDetailsInput,
} from '@/features/courses/schemas';
import { FileUpload } from '@/features/courses/components/FileUpload';
import { createCourse, updateCourseDetails } from '@/features/courses/server/actions';
import { RichTextEditor } from '@/shared/components/dashboard/RichTextEditor';
import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

export interface CategoryOption {
  id: string;
  name: string;
}

export interface CategoryGroupOption {
  label: string;
  options: CategoryOption[];
}

/** Grouped category choices for the tagging <select>: leaf top-levels + parent groups. */
export interface CategoryChoices {
  ungrouped: CategoryOption[];
  groups: CategoryGroupOption[];
}

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export function CourseDetailsForm({
  categories,
  mode,
  courseId,
  defaultValues,
  builderBasePath = '/instructor/courses',
  instructors,
}: {
  categories: CategoryChoices;
  mode: 'create' | 'edit';
  courseId?: string;
  defaultValues?: Partial<CourseDetailsInput>;
  /** Where to go after creating — the role's course builder base. */
  builderBasePath?: string;
  instructors?: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [thumbnailKey, setThumbnailKey] = useState(defaultValues?.thumbnailKey ?? '');
  const [introVideoKey, setIntroVideoKey] = useState(defaultValues?.introVideoKey ?? '');
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CourseDetailsInput>({
    resolver: zodResolver(courseDetailsSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      categoryId: '',
      difficulty: 'BEGINNER',
      language: 'en',
      price: 0,
      originalPrice: undefined,
      isPromo: false,
      thumbnailKey: '',
      introVideoKey: '',
      instructorId: '',
      ...defaultValues,
    },
  });

  async function onSubmit(values: CourseDetailsInput) {
    if (mode === 'create') {
      const result = await createCourse(values);
      if (!result.ok || !result.courseId) {
        toast.error(result.error ?? 'Could not create course');
        return;
      }
      toast.success('Course created.');
      router.push(`${builderBasePath}/${result.courseId}`);
      return;
    }

    const result = await updateCourseDetails(courseId!, values);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not save course');
      return;
    }
    toast.success('Course details saved.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input id="title" {...register('title')} />
          <FieldError errors={[errors.title]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="subtitle">Subtitle</FieldLabel>
          <Input id="subtitle" {...register('subtitle')} />
          <FieldError errors={[errors.subtitle]} />
        </Field>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Describe what learners will get from this course…"
                aria-label="Course description"
              />
            )}
          />
          <FieldError errors={[errors.description]} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="categoryId">Category</FieldLabel>
            <select id="categoryId" className={cn(selectClass)} {...register('categoryId')}>
              <option value="">Uncategorized</option>
              {categories.ungrouped.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              {categories.groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="difficulty">Difficulty</FieldLabel>
            <select id="difficulty" className={cn(selectClass)} {...register('difficulty')}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="language">Language</FieldLabel>
            <Input id="language" {...register('language')} />
            <FieldError errors={[errors.language]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="price">Price (NPR)</FieldLabel>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register('price', { valueAsNumber: true })}
            />
            <FieldError errors={[errors.price]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="originalPrice">Original Price / Cross-out (NPR)</FieldLabel>
            <Input
              id="originalPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="E.g. 33000"
              {...register('originalPrice', { valueAsNumber: true })}
            />
            <FieldDescription>Optional. Shown strikethrough if on offer.</FieldDescription>
            <FieldError errors={[errors.originalPrice]} />
          </Field>
        </div>
        <Field className="flex items-center gap-3 rounded-lg border border-border p-3.5 bg-accent/20">
          <input
            id="isPromo"
            type="checkbox"
            className="size-4 rounded border-input text-primary focus:ring-primary"
            {...register('isPromo')}
          />
          <div>
            <FieldLabel htmlFor="isPromo" className="font-semibold cursor-pointer">
              🔥 Highlight as Special Offer / Promo Course
            </FieldLabel>
            <FieldDescription className="text-xs">
              Featuring this course will make it appear in the Special Offer banner on the student portal home page.
            </FieldDescription>
          </div>
        </Field>
        <Field>
          <FieldLabel>Thumbnail</FieldLabel>
          {courseId ? (
            <>
              <FileUpload
                courseId={courseId}
                kind="thumbnail"
                accept="image/png,image/jpeg,image/webp"
                value={thumbnailKey || undefined}
                onUploaded={(key) => {
                  setThumbnailKey(key);
                  setValue('thumbnailKey', key, { shouldDirty: true });
                }}
              />
              <FieldDescription>PNG, JPEG, or WebP. Remember to save details after uploading.</FieldDescription>
            </>
          ) : (
            <FieldDescription>Create the course first, then upload a thumbnail here.</FieldDescription>
          )}
          <input type="hidden" {...register('thumbnailKey')} />
        </Field>
        <Field>
          <FieldLabel>Intro Video</FieldLabel>
          {courseId ? (
            <>
              <FileUpload
                courseId={courseId}
                kind="video"
                accept="video/mp4,video/webm"
                value={introVideoKey || undefined}
                onUploaded={(key) => {
                  setIntroVideoKey(key);
                  setValue('introVideoKey', key, { shouldDirty: true });
                }}
              />
              <FieldDescription>MP4 or WebM format. This acts as the course preview/intro video.</FieldDescription>
            </>
          ) : (
            <FieldDescription>Create the course first, then upload an intro video here.</FieldDescription>
          )}
          <input type="hidden" {...register('introVideoKey')} />
        </Field>
        {instructors && instructors.length > 0 && (
          <Field>
            <FieldLabel htmlFor="instructorId">Instructor (Admin Only)</FieldLabel>
            <select id="instructorId" className={cn(selectClass)} {...register('instructorId')}>
              <option value="">Select Instructor...</option>
              {instructors.map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.name} ({ins.email})
                </option>
              ))}
            </select>
          </Field>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create course' : 'Save details'}
        </Button>
      </FieldGroup>
    </form>
  );
}
