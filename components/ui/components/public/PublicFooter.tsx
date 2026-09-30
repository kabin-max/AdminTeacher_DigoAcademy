import { Mail } from 'lucide-react';
import Link from 'next/link';

import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
);

const LINK_COLUMNS = [
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Courses', href: '/courses' },
      { label: 'Career Roadmap', href: '/career-roadmap' },
      { label: 'Blogs', href: '/blogs' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Contact us', href: '/contact' },
    ],
  },
  {
    heading: 'Account & Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
    ],
  },
];

const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61554822595076', icon: Facebook },
  { label: 'LinkedIn', href: '#', icon: Linkedin },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border/80 bg-white text-slate-600 dark:bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[2fr_1fr_1fr] lg:px-8">
        <div className="max-w-xs">
          <BrandLogo className="h-10" />
          <p className="mt-4 text-sm text-slate-500">
            Live and self-paced courses, taught by practitioners. Learn the skills that move your
            career forward.
          </p>
          <a
            href="mailto:support@digoacademy.com"
            className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-primary"
          >
            <Mail className="size-4" />
            support@digoacademy.com
          </a>
          <div className="mt-5 flex items-center gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:text-slate-300"
              >
                <social.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        {LINK_COLUMNS.map((column) => (
          <div key={column.heading}>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-foreground">{column.heading}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-500 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200/80 dark:border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <span>© {new Date().getFullYear()} Digo Academy. All rights reserved.</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
            <span>
              Technology Partner{' '}
              <a
                href="https://digosolution.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-primary transition-colors"
              >
                DigoSolution
              </a>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
