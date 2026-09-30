import { InstructorProfileForm } from '@/features/profile/components/InstructorProfileForm';
import { getInstructorProfile } from '@/features/profile/server/data';
import { requireRole } from '@/lib/auth/session';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { ROLES } from '@/shared/constants/roles';

export default async function InstructorProfilePage() {
  const session = await requireRole(ROLES.INSTRUCTOR);
  const profile = await getInstructorProfile(session.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">{profile.email}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>
            Your public instructor profile — experience, portfolio, and links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstructorProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
