import 'server-only';

import { db } from '@/lib/db';

export async function getInstructorCourses(instructorId: string) {
  return db.course.findMany({
    where: { instructorId },
    orderBy: { updatedAt: 'desc' },
    include: {
      category: { select: { name: true } },
      _count: { select: { sections: true, enrollments: true } },
    },
  });
}

/** Full course for the builder — scoped to its owner (returns null otherwise). */
export async function getCourseForInstructor(courseId: string, instructorId: string) {
  return db.course.findFirst({
    where: { id: courseId, instructorId },
    include: {
      category: true,
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              quiz: {
                include: { questions: { orderBy: { order: 'asc' }, include: { choices: true } } },
              },
            },
          },
        },
      },
    },
  });
}

/** Courses needing admin attention: submitted for review, or flagged for re-review. */
export async function getAdminReviewQueue() {
  return db.course.findMany({
    where: { OR: [{ status: 'SUBMITTED' }, { reReviewFlagged: true }] },
    orderBy: { updatedAt: 'asc' },
    include: {
      category: { select: { name: true } },
      instructor: { select: { name: true, email: true } },
    },
  });
}

/** Every course, for the admin management list. */
export async function getAllCoursesForAdmin() {
  return db.course.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      category: { select: { name: true } },
      instructor: { select: { name: true, email: true } },
      _count: { select: { sections: true, enrollments: true } },
    },
  });
}

export async function getCourseForAdmin(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      instructor: { select: { name: true, email: true } },
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              quiz: {
                include: { questions: { orderBy: { order: 'asc' }, include: { choices: true } } },
              },
            },
          },
        },
      },
    },
  });
}
