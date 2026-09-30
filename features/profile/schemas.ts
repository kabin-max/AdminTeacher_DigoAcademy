import { z } from 'zod';

/** Optional URL that also accepts an empty string (cleared field). */
const optionalUrl = z.union([z.string().url('Enter a valid URL'), z.literal('')]).optional();

const optionalText = (max: number) => z.union([z.string().max(max), z.literal('')]).optional();

export const studentProfileSchema = z.object({
  name: z.string().min(2, 'Enter your name').max(100),
  bio: optionalText(500),
  /** Comma-separated in the form; split into an array server-side. */
  skills: optionalText(300),
});
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

export const instructorProfileSchema = z.object({
  name: z.string().min(2, 'Enter your name').max(100),
  headline: optionalText(120),
  experience: optionalText(2000),
  portfolioUrl: optionalUrl,
  twitter: optionalUrl,
  linkedin: optionalUrl,
  website: optionalUrl,
});
export type InstructorProfileInput = z.infer<typeof instructorProfileSchema>;

/** Parse the comma-separated skills field into a clean, de-duplicated array. */
export function parseSkills(input: string | undefined): string[] {
  if (!input) return [];
  return [
    ...new Set(
      input
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];
}
