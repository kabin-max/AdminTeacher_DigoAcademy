import { z } from 'zod';

/**
 * Admin-created instructor account. Students self-register; instructors are
 * provisioned by an admin, who sets an initial password to share with them.
 * Password rules kept local (features must not reach into another feature).
 */
export const createInstructorSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(100, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
export type CreateInstructorInput = z.infer<typeof createInstructorSchema>;
