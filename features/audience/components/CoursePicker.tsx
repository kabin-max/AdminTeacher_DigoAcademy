'use client';

import { useRouter } from 'next/navigation';

import type { SegmentCourse } from '@/features/audience/server/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

/** The label shown both in the dropdown list and (via `items`) in the trigger. */
function courseLabel(course: SegmentCourse): string {
  const signals = course._count.enrollments + course._count.inquiries + course._count.wishlistedBy;
  return `${course.title}${course.category ? ` · ${course.category.name}` : ''}${
    signals > 0 ? ` (${signals})` : ''
  }`;
}

/** Course dropdown that navigates to `?courseId=…` (resetting any filter). */
export function CoursePicker({ courses, value }: { courses: SegmentCourse[]; value?: string }) {
  const router = useRouter();

  // `items` lets base-ui's <Select.Value> resolve the label for a value that
  // was set before the popup was ever opened (e.g. from the `?courseId=`
  // URL param on first load) — without it, it falls back to printing the
  // raw course id since no <Select.Item> has mounted yet to register a label.
  const items: Record<string, string> = Object.fromEntries(
    courses.map((course) => [course.id, courseLabel(course)])
  );

  return (
    <Select
      items={items}
      value={value ?? null}
      onValueChange={(next) =>
        router.push(next ? `/admin/learning-paths?courseId=${next}` : '/admin/learning-paths')
      }
    >
      <SelectTrigger className="w-full max-w-md">
        <SelectValue placeholder="Select a course…" />
      </SelectTrigger>
      <SelectContent>
        {courses.map((course) => (
          <SelectItem key={course.id} value={course.id}>
            {courseLabel(course)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
