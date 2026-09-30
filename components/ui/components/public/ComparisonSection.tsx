import { Check, Layers, X } from 'lucide-react';

import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';
import { Reveal } from '@/shared/components/public/Reveal';

const DIGO_ADVANTAGES = [
  'Highly Affordable, No Quality Cuts',
  'Project-Based, Skill-First Learning',
  'Continuously Updated With Industry Trends',
  'Internal Hackathons, Challenges & Face-Offs',
  'Industry-Relevant, Job-Oriented Curriculum',
];

const OTHERS_DISADVANTAGES = [
  'High Fees With Compromised Quality',
  'Theory-Centric Learning',
  'Outdated, Static Curriculum',
  'No Competitive Learning Environment',
  'Limited Practical Exposure',
];

export function ComparisonSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 text-foreground sm:py-28">
      {/* Background soft ambient accents */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 size-96 translate-x-1/2 translate-y-1/2 rounded-full bg-brand-blue/5 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            What Sets Digo Academy Apart<br /> From Others
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Compare our hands-on, production-grade model against traditional theory-heavy tutorials.
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-12 sm:mt-16">
          <div className="mx-auto max-w-5xl rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-8 shadow-xl ring-1 ring-border/50">
            <div className="grid gap-6 md:grid-cols-2 md:gap-8 items-stretch">
              {/* Digo Academy Column (Highlighted with green accent) */}
              <div className="relative flex flex-col justify-between rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-b from-emerald-50/60 via-card to-card p-6 sm:p-8 shadow-md shadow-emerald-500/5 dark:from-emerald-950/20">
                {/* Brand Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-emerald-500/20">
                  <BrandLogo className="h-8 w-auto" />
                  <div className="h-7 w-px bg-emerald-500/30" />
                  <div className="leading-tight">
                    <span className="block font-heading text-base font-bold tracking-tight text-foreground">
                      Digo Academy
                    </span>
                    <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Coding School
                    </span>
                  </div>
                </div>

                {/* Advantages list */}
                <ul className="mt-6 space-y-4 sm:space-y-5">
                  {DIGO_ADVANTAGES.map((item) => (
                    <li key={item} className="flex items-center gap-3.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-xs">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                      <span className="text-sm font-semibold text-foreground sm:text-base leading-snug">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Others Column */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-border/60 bg-muted/30 p-6 sm:p-8">
                {/* Others Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-border/60">
                  <Layers className="size-6 text-muted-foreground" />
                  <span className="font-heading text-xl font-bold tracking-tight text-muted-foreground sm:text-2xl">
                    Others
                  </span>
                </div>

                {/* Disadvantages list */}
                <ul className="mt-6 space-y-4 sm:space-y-5">
                  {OTHERS_DISADVANTAGES.map((item) => (
                    <li key={item} className="flex items-center gap-3.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400 shadow-xs">
                        <X className="size-3 stroke-[3]" />
                      </span>
                      <span className="text-sm font-medium text-muted-foreground sm:text-base leading-snug">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
