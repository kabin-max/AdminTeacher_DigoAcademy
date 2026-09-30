'use server';

import { randomUUID } from 'node:crypto';

import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { isS3Configured } from '@/lib/env';
import { presignUpload } from '@/lib/storage';
import { ROLES } from '@/shared/constants/roles';

export type UploadKind = 'thumbnail' | 'video' | 'pdf';

interface KindRule {
  prefix: string;
  contentTypes: string[];
  maxBytes: number;
}

const KIND_RULES: Record<UploadKind, KindRule> = {
  thumbnail: { prefix: 'thumbnails', contentTypes: ['image/png', 'image/jpeg', 'image/webp'], maxBytes: 5_000_000 },
  video: { prefix: 'videos', contentTypes: ['video/mp4', 'video/webm', 'video/quicktime'], maxBytes: 2_000_000_000 },
  pdf: { prefix: 'notes', contentTypes: ['application/pdf'], maxBytes: 50_000_000 },
};

export interface PresignResult {
  ok: boolean;
  error?: string;
  url?: string;
  key?: string;
}

const extFromName = (name: string) => {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name);
  return match ? match[1].toLowerCase() : 'bin';
};

/**
 * Presign a course file upload. Authorization is re-checked here (direct-POST
 * reachable): the caller must be an admin, or the instructor who owns the course.
 * The key is server-controlled and scoped to the course, so clients can't write
 * anywhere they like.
 */
export async function presignCourseUpload(input: {
  courseId: string;
  kind: UploadKind;
  filename: string;
  contentType: string;
  size: number;
}): Promise<PresignResult> {
  const session = await authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (!isS3Configured) return { ok: false, error: 'File storage is not configured.' };

  const rule = KIND_RULES[input.kind];
  if (!rule) return { ok: false, error: 'Unsupported upload type.' };
  if (!rule.contentTypes.includes(input.contentType)) {
    return { ok: false, error: `That file type isn't allowed for a ${input.kind}.` };
  }
  if (input.size > rule.maxBytes) {
    return { ok: false, error: 'That file is too large.' };
  }

  // Admins manage any course; instructors only their own.
  const isAdmin = session.user.role === ROLES.ADMIN;
  const course = await db.course.findFirst({
    where: isAdmin ? { id: input.courseId } : { id: input.courseId, instructorId: session.user.id },
    select: { id: true },
  });
  if (!course) return { ok: false, error: 'Course not found.' };

  const key = `courses/${course.id}/${rule.prefix}/${randomUUID()}.${extFromName(input.filename)}`;
  const url = await presignUpload(key, input.contentType);
  return { ok: true, url, key };
}
