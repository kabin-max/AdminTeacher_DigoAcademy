import { toCsv } from '@/features/audience/csv';
import {
  applySegmentFilter,
  getCourseSegment,
  isSegmentFilter,
} from '@/features/audience/server/data';
import { authorize } from '@/lib/auth/session';
import { ROLES } from '@/shared/constants/roles';

/** CSV export of a course's audience segment (admin only). */
export async function GET(request: Request) {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return new Response('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const courseId = url.searchParams.get('courseId');
  if (!courseId) return new Response('Missing courseId', { status: 400 });

  const filterParam = url.searchParams.get('filter') ?? undefined;
  const filter = isSegmentFilter(filterParam) ? filterParam : 'all';

  const segment = await getCourseSegment(courseId);
  if (!segment) return new Response('Course not found', { status: 404 });

  const people = applySegmentFilter(segment.people, filter);
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Enrolled',
    'Progress %',
    'Inquiry status',
    'Wishlisted',
    'Course',
  ];
  const rows = people.map((p) => [
    p.name,
    p.email,
    p.phone ?? '',
    p.enrolled ? 'yes' : 'no',
    p.progressPct ?? '',
    p.inquiryStatus ?? '',
    p.wishlisted ? 'yes' : 'no',
    segment.course.title,
  ]);

  const slug =
    segment.course.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'course';
  // Prepend a UTF-8 BOM so Excel opens accented names correctly.
  const csv = `﻿${toCsv(headers, rows)}`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="learning-path-${slug}-${filter}.csv"`,
    },
  });
}
