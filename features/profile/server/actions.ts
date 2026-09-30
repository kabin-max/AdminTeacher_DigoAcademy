'use server';

import { revalidatePath } from 'next/cache';

import {
  instructorProfileSchema,
  parseSkills,
  studentProfileSchema,
  type InstructorProfileInput,
  type StudentProfileInput,
} from '@/features/profile/schemas';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ProfileActionResult {
  ok: boolean;
  error?: string;
}

const cleanUrl = (value: string | undefined) => (value && value.length > 0 ? value : undefined);

export async function updateStudentProfile(
  input: StudentProfileInput
): Promise<ProfileActionResult> {
  const session = await authorize(ROLES.STUDENT);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = studentProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check the form and try again.' };

  const { name, bio, skills } = parsed.data;
  const userId = session.user.id;
  const skillList = parseSkills(skills);

  await db.user.update({ where: { id: userId }, data: { name } });
  await db.studentProfile.upsert({
    where: { userId },
    create: { userId, bio: bio || null, skills: skillList },
    update: { bio: bio || null, skills: skillList },
  });

  revalidatePath('/student/profile');
  revalidatePath('/student');
  return { ok: true };
}

export async function updateInstructorProfile(
  input: InstructorProfileInput
): Promise<ProfileActionResult> {
  const session = await authorize(ROLES.INSTRUCTOR);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = instructorProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check the form and try again.' };

  const { name, headline, experience, portfolioUrl, twitter, linkedin, website } = parsed.data;
  const userId = session.user.id;

  const social = {
    twitter: cleanUrl(twitter),
    linkedin: cleanUrl(linkedin),
    website: cleanUrl(website),
  };

  const profileData = {
    headline: headline || null,
    experience: experience || null,
    portfolioUrl: cleanUrl(portfolioUrl) ?? null,
    socialLinks: social,
  };

  await db.user.update({ where: { id: userId }, data: { name } });
  await db.instructorProfile.upsert({
    where: { userId },
    create: { userId, ...profileData },
    update: profileData,
  });

  revalidatePath('/instructor/profile');
  revalidatePath('/instructor');
  return { ok: true };
}
