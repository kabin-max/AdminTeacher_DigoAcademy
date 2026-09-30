import { buildCourseImportTemplate } from '@/features/course-import/server/template';
import { authorize } from '@/lib/auth/session';
import { ROLES } from '@/shared/constants/roles';

/** Downloadable .docx starter matching the course importer's expected format. */
export async function GET() {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return new Response('Forbidden', { status: 403 });

  const buffer = await buildCourseImportTemplate();

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="course-import-template.docx"',
    },
  });
}
