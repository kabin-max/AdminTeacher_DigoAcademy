import 'server-only';

import { db } from '@/lib/db';
import type {
  InstructorProfileView,
  SocialLinks,
  StudentProfileView,
} from '@/features/profile/types';

function toSocialLinks(value: unknown): SocialLinks {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      twitter: typeof v.twitter === 'string' ? v.twitter : undefined,
      linkedin: typeof v.linkedin === 'string' ? v.linkedin : undefined,
      website: typeof v.website === 'string' ? v.website : undefined,
    };
  }
  return {};
}

export async function getStudentProfile(userId: string): Promise<StudentProfileView> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, studentProfile: true },
  });
  return {
    name: user.name,
    email: user.email,
    bio: user.studentProfile?.bio ?? '',
    skills: user.studentProfile?.skills ?? [],
  };
}

export async function getInstructorProfile(userId: string): Promise<InstructorProfileView> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, instructorProfile: true },
  });
  const p = user.instructorProfile;
  return {
    name: user.name,
    email: user.email,
    headline: p?.headline ?? '',
    experience: p?.experience ?? '',
    portfolioUrl: p?.portfolioUrl ?? '',
    social: toSocialLinks(p?.socialLinks),
    ratingAvg: p?.ratingAvg ?? 0,
    totalStudents: p?.totalStudents ?? 0,
  };
}
