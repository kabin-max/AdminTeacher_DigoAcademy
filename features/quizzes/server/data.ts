import 'server-only';

import { db } from '@/lib/db';

export interface QuizOverview {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  sectionTitle: string;
  questionCount: number;
  passingScore: number;
  timeLimitSec: number | null;
  attemptCount: number;
  instructorName?: string;
  lastAttemptScore?: number | null;
  passed?: boolean | null;
}

/** Quizzes created by an instructor across their courses. */
export async function getInstructorQuizzes(instructorId: string): Promise<QuizOverview[]> {
  const quizzes = await db.quiz.findMany({
    where: { lesson: { section: { course: { instructorId } } } },
    include: {
      lesson: {
        select: {
          section: {
            select: {
              title: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { lesson: { section: { course: { updatedAt: 'desc' } } } },
  });

  return quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    courseId: q.lesson.section.course.id,
    courseTitle: q.lesson.section.course.title,
    sectionTitle: q.lesson.section.title,
    questionCount: q._count.questions,
    passingScore: q.passingScore,
    timeLimitSec: q.timeLimitSec,
    attemptCount: q._count.attempts,
  }));
}

/** Quizzes available to an enrolled student across their courses. */
export async function getStudentQuizzes(studentId: string): Promise<QuizOverview[]> {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  if (courseIds.length === 0) return [];

  const quizzes = await db.quiz.findMany({
    where: { lesson: { section: { courseId: { in: courseIds } } } },
    include: {
      lesson: {
        select: {
          section: {
            select: {
              title: true,
              course: { select: { id: true, title: true, instructor: { select: { name: true } } } },
            },
          },
        },
      },
      attempts: {
        where: { studentId, submittedAt: { not: null } },
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: { score: true, passed: true },
      },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    courseId: q.lesson.section.course.id,
    courseTitle: q.lesson.section.course.title,
    sectionTitle: q.lesson.section.title,
    instructorName: q.lesson.section.course.instructor.name,
    questionCount: q._count.questions,
    passingScore: q.passingScore,
    timeLimitSec: q.timeLimitSec,
    attemptCount: q._count.attempts,
    lastAttemptScore: q.attempts[0]?.score ?? null,
    passed: q.attempts[0]?.passed ?? null,
  }));
}

/** All quizzes in the system for admin review. */
export async function getAdminQuizzes(): Promise<QuizOverview[]> {
  const quizzes = await db.quiz.findMany({
    include: {
      lesson: {
        select: {
          section: {
            select: {
              title: true,
              course: { select: { id: true, title: true, instructor: { select: { name: true } } } },
            },
          },
        },
      },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { lesson: { section: { course: { updatedAt: 'desc' } } } },
  });

  return quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    courseId: q.lesson.section.course.id,
    courseTitle: q.lesson.section.course.title,
    sectionTitle: q.lesson.section.title,
    instructorName: q.lesson.section.course.instructor.name,
    questionCount: q._count.questions,
    passingScore: q.passingScore,
    timeLimitSec: q.timeLimitSec,
    attemptCount: q._count.attempts,
  }));
}

export interface CourseOption {
  id: string;
  title: string;
  sections: { id: string; title: string }[];
}

export async function getInstructorCourseOptions(instructorId: string, isAdmin = false): Promise<CourseOption[]> {
  const courses = await db.course.findMany({
    where: isAdmin ? {} : { instructorId },
    select: {
      id: true,
      title: true,
      sections: { select: { id: true, title: true }, orderBy: { order: 'asc' } },
    },
    orderBy: { title: 'asc' },
  });
  return courses;
}
