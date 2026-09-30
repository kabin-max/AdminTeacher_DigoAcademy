import 'server-only';

import mammoth from 'mammoth';

import { parseCourseHtml, type CourseDraft } from '@/features/course-import/parse';

/** Convert a .docx buffer to a structured CourseDraft via mammoth → HTML → parser. */
export async function extractCourseDraft(buffer: Buffer): Promise<CourseDraft> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return parseCourseHtml(html);
}
