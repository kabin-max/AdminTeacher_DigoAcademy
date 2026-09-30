'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles, Target, Clock, GraduationCap } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: {
    label: string;
    description: string;
    value: string;
    icon?: string;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'goal',
    title: 'What best describes your goal?',
    subtitle: 'Select your primary objective to find the right AWS course.',
    options: [
      {
        label: "I'm completely new to AWS",
        description: 'Start with AWS Cloud Practitioner and build your cloud foundation.',
        value: 'beginner',
      },
      {
        label: 'I want to understand AI on AWS',
        description: 'Explore AWS AI and generative AI concepts with AI Practitioner.',
        value: 'ai',
      },
      {
        label: 'I want to build applications on AWS',
        description: 'Develop cloud applications and prepare for Developer - Associate.',
        value: 'developer',
      },
      {
        label: 'I want to design AWS infrastructure',
        description: 'Learn architecture and prepare for Solutions Architect - Associate.',
        value: 'architect',
      },
      { 
        label: 'I want to become a DevOps professional',
        description: 'Build advanced AWS automation, CI/CD, and deployment skills.',
        value: 'devops',
      },
    ],
  },
];

const RECOMMENDATIONS: Record<string, {
  title: string;
  category: string;
  duration: string;
  mode: string;
  href: string;
  reason: string;
}> = {
  beginner: {
    title: 'AWS Cloud Practitioner',
    category: 'AWS',
    duration: 'Self-Paced or Live',
    mode: 'Foundational',
    href: '/courses/seed-course-aws-cp',
    reason: 'Matches your goal of building a cloud foundation from scratch.',
  },
  ai: {
    title: 'AWS AI Practitioner',
    category: 'AWS',
    duration: 'Self-Paced or Live',
    mode: 'Foundational',
    href: '/courses/seed-course-aws-ai',
    reason: 'Perfect for learning AI and Generative AI concepts on AWS.',
  },
  developer: {
    title: 'AWS Developer - Associate',
    category: 'AWS',
    duration: 'Self-Paced or Live',
    mode: 'Associate',
    href: '/courses/seed-course-aws-dev',
    reason: 'Aligned with your goal of developing cloud applications.',
  },
  architect: {
    title: 'AWS Solutions Architect - Associate',
    category: 'AWS',
    duration: 'Self-Paced or Live',
    mode: 'Associate',
    href: '/courses/seed-course-aws-saa',
    reason: 'Designed to teach you how to architect robust AWS infrastructure.',
  },
  devops: {
    title: 'AWS DevOps Engineer - Professional',
    category: 'AWS',
    duration: 'Self-Paced or Live',
    mode: 'Professional',
    href: '/courses/seed-course-aws-devops',
    reason: 'Advanced curriculum to master CI/CD and DevOps automation.',
  },
};

export function CourseFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQ = QUESTIONS[step];
  const isComplete = step >= QUESTIONS.length;

  const handleSelect = (val: string) => {
    const updated = { ...answers, [currentQ.id]: val };
    setAnswers(updated);
    setStep((prev) => prev + 1);
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
  };

  const recommendation = RECOMMENDATIONS[answers.goal] ?? RECOMMENDATIONS.beginner;

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/5 via-background to-violet-500/5 p-8 shadow-2xl sm:p-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 size-64 rounded-full bg-violet-500/10 blur-3xl" />
      
      <div className="relative z-10 mb-6 flex flex-col items-center text-center border-b border-border/60 pb-5">

        {!isComplete ? (
          <div className="mt-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>Step {step + 1} of {QUESTIONS.length}</span>
            <div className="flex gap-1">
              {QUESTIONS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    idx <= step ? 'bg-brand-blue' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleReset} className="mt-2.5 gap-1.5 text-xs text-muted-foreground hover:text-brand-blue">
            <RotateCcw className="size-3.5" />
            Start over
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground sm:text-2xl">{currentQ.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{currentQ.subtitle}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {currentQ.options.map((opt, idx) => (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className="group relative flex flex-col items-start rounded-2xl border border-border/80 bg-card/80 p-5 text-left transition-all hover:border-brand-blue/50 hover:bg-brand-blue/5 hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                >
                  <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowRight className="size-4 text-brand-blue" />
                  </div>
                  <span className="font-bold text-foreground group-hover:text-brand-blue transition-colors pr-8">
                    {opt.label}
                  </span>
                  <span className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {opt.description}
                  </span>
                </motion.button>
              ))}
            </div>

            {step > 0 && (
              <div className="pt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep((s) => s - 1)} 
                  className="text-xs font-medium hover:text-brand-blue transition-colors"
                >
                  ← Back to previous question
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-brand-blue/20 bg-gradient-to-br from-card to-card/50 p-8 shadow-lg sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Recommended for you
              </div>

              <h3 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {recommendation.title}
              </h3>

              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                {recommendation.reason}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-lg bg-brand-blue/5 px-3 py-2 ring-1 ring-brand-blue/15">
                  <GraduationCap className="size-5 text-brand-blue" />
                  {recommendation.category}
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-violet-500/5 px-3 py-2 ring-1 ring-violet-500/15">
                  <Clock className="size-5 text-violet-600" />
                  {recommendation.duration}
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2 ring-1 ring-emerald-500/15">
                  <Target className="size-5 text-emerald-600" />
                  {recommendation.mode}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  className="group rounded-full bg-linear-to-r from-brand-blue to-violet-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/25 transition-all hover:shadow-xl hover:shadow-brand-blue/30 hover:scale-105"
                  nativeButton={false}
                  render={
                    <Link href={recommendation.href}>
                      Explore This Course 
                      <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-brand-blue/30 px-6 py-3 text-sm font-semibold hover:bg-brand-blue/5 hover:border-brand-blue/50"
                  nativeButton={false}
                  render={<Link href="/contact">Talk to a Counsellor</Link>}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
