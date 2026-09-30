import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { Panel } from '@/shared/components/dashboard/Panel';
import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <Panel className="p-8 shadow-lg">
      <div className="mb-6 flex flex-col items-center text-center">
        <Link href="/" aria-label="Digo Academy home" className="mb-6">
          <BrandLogo className="h-14" />
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start learning with Digo Academy.</p>
      </div>
      <RegisterForm />
    </Panel>
  );
}
