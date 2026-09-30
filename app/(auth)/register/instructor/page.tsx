import { redirect } from 'next/navigation';

/**
 * Retired route. Public instructor self-registration was removed — instructors
 * are created by an admin (Admin ▸ Users ▸ Instructors). Anyone hitting the old
 * URL is sent to the standard (student) sign-up.
 */
export default function InstructorRegisterPage() {
  redirect('/register');
}
