import 'server-only';

import { mergeSegment } from '@/features/audience/segment';
import { db } from '@/lib/db';

export {
  applySegmentFilter,
  isSegmentFilter,
  type SegmentFilter,
  type SegmentPerson,
} from '@/features/audience/segment';
import type { SegmentPerson, SegmentCounts } from '@/features/audience/segment';

/**
 * "Learning paths" = marketing audience segments grouped by course. For a chosen
 * course we gather everyone connected to it — enrolled students, people who
 * inquired (incl. guests), and wishlisters — deduplicated into one contact list
 * for discount/offer outreach. Deliberately separate from LearningPlan (an
 * enrollment/delivery cohort). The merge/filter lives in `../segment` (pure).
 */

export interface CourseSegment {
  course: { id: string; title: string; categoryName: string | null };
  people: SegmentPerson[];
  counts: SegmentCounts;
}

/** Courses to pick from, with rough signal counts to size each audience. */
export async function getSegmentCourses() {
  return db.course.findMany({
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      category: { select: { name: true } },
      _count: { select: { enrollments: true, inquiries: true, wishlistedBy: true } },
    },
  });
}

export type SegmentCourse = Awaited<ReturnType<typeof getSegmentCourses>>[number];

export async function getCourseSegment(courseId: string): Promise<CourseSegment | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, category: { select: { name: true } } },
  });
  if (!course) return null;

  const [enrollments, inquiries, wishlist] = await Promise.all([
    db.enrollment.findMany({
      where: { courseId },
      select: { progressPct: true, enrolledAt: true, student: { select: { id: true, name: true, email: true } } },
    }),
    db.inquiry.findMany({
      where: { courseId },
      select: {
        status: true,
        createdAt: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        student: { select: { id: true, name: true, email: true } },
      },
    }),
    db.wishlistItem.findMany({
      where: { courseId },
      select: { createdAt: true, student: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const { people, counts } = mergeSegment({
    enrollments: enrollments.map((e) => ({
      studentId: e.student.id,
      name: e.student.name,
      email: e.student.email,
      progressPct: e.progressPct,
      since: e.enrolledAt,
    })),
    inquiries: inquiries.map((i) => ({
      studentId: i.student?.id ?? null,
      name: i.student?.name ?? i.guestName ?? '',
      email: i.student?.email ?? i.guestEmail ?? '',
      phone: i.guestPhone ?? null,
      status: i.status,
      since: i.createdAt,
    })),
    wishlist: wishlist.map((w) => ({
      studentId: w.student.id,
      name: w.student.name,
      email: w.student.email,
      since: w.createdAt,
    })),
  });

  return {
    course: { id: course.id, title: course.title, categoryName: course.category?.name ?? null },
    people,
    counts,
  };
}
