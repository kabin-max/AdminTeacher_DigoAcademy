'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Reveal } from '@/shared/components/public/Reveal';

const REVIEWS = [
  {
    quote:
      'Thanks to Digo Academy I could transition from non-tech into software engineering within 4 months. The weekly code reviews and live mentorship gave me the confidence to crack high-paying interviews.',
    name: 'Wade Warren',
    role: 'Frontend Engineer @ Veloce Tech',
    rating: 5,
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    quote:
      'I think this is the most production-aligned curriculum I have ever completed. Deploying scalable Docker containers, microservices, and AI pipelines set my portfolio apart from everyone else.',
    name: 'Theresa Jordan',
    role: 'AI Applications Developer @ CloudForge',
    rating: 5,
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  },
  {
    quote:
      'The live sprint cadence and pair-programming voice rooms are incredible. You never get stuck in tutorial hell because senior engineers look at your Git commits and help you debug in real time.',
    name: 'James Wilson',
    role: 'Full-Stack Engineer @ Remote Global',
    rating: 5,
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    quote:
      'From zero algorithmic thinking to clearing hard technical evaluations. The hackathons and mock interviews prepared me thoroughly for production pressure.',
    name: 'Jhon Tosan',
    role: 'Software Architect @ FinTech Systems',
    rating: 5,
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
];

const FAQS = [
  {
    q: 'What is Digo Academy and how does it work?',
    a: 'Digo Academy is a digital engineering academy focused on live cohorts, production-grade project development, and rigorous 1-on-1 code reviews. You build real applications rather than passive tutorial watching.',
  },
  {
    q: 'Are the sessions live or recorded?',
    a: 'All major core concepts, sprints, and architecture deep-dives are conducted live with interactive Q&A. Every live session is recorded and uploaded to your student portal with lifetime access.',
  },
  {
    q: 'What kind of support and mentor feedback will I get?',
    a: 'You receive line-by-line code reviews on your Git repositories from experienced engineers, access to daily voice office hours, and dedicated private Discord channels for fast blocker resolution.',
  },
  {
    q: 'How do enrollment and payments work?',
    a: 'Browse our catalog and submit a free enrollment request in seconds. There is no online payment gateway — our team arranges payment and activates your access manually.',
  },
  {
    q: 'Do you offer certificate and placement assistance?',
    a: 'Yes. Upon passing all module evaluations and capstone defense, you receive a verified shareable certificate and gain access to our hiring partner network and alumni demo days.',
  },
];

export interface ReviewsAndFaqSectionProps {
  showFaq?: boolean;
}

export function ReviewsAndFaqSection({ showFaq = true }: ReviewsAndFaqSectionProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % REVIEWS.length);
      }, 4000); // Auto-advance every 4 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered]);

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Thank you! Our advisory team will get in touch shortly.');
    setEmail('');
  };

  // Determine which 3 reviews to show on desktop
  const visibleReviews = [
    REVIEWS[currentIndex],
    REVIEWS[(currentIndex + 1) % REVIEWS.length],
    REVIEWS[(currentIndex + 2) % REVIEWS.length],
  ];

  return (
    <section className="relative bg-background py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Testimonials Header with Prev/Next Controls */}
        <div className="flex flex-wrap items-end justify-center gap-4 pb-14">
          <Reveal>
            <div className="relative text-center">
              {/* Blue playful doodle marks */}
              <div className="absolute -top-6 -left-3 text-brand-blue/50 select-none pointer-events-none">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12C6 8 8 6 12 4" />
                </svg>
              </div>
              <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Real Stories From<br />Our Cohort Builders.
              </h2>
            </div>
          </Reveal>
        </div>

       
        {/* Testimonial Cards Grid */}
        <div 
          className="grid gap-5 md:grid-cols-3"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {visibleReviews.map((rev, i) => (
            <div
              key={`${currentIndex}-${i}`}
              className="flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-7 shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1.5 hover:border-border/80 animate-fade-in"
            >
              <div>
                <Quote className="size-8 text-brand-blue/25 fill-brand-blue/8" />
                <p className="mt-4 text-sm text-foreground leading-relaxed">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="mt-7 flex items-center gap-3 pt-5 border-t border-border/50">
                <div className="min-w-0">
                  <p className="font-heading font-bold text-sm text-foreground truncate">{rev.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{rev.role}</p>
                  <div className="mt-1 flex items-center gap-0.5">
                    {[...Array(rev.rating)].map((_, idx) => (
                      <Star key={idx} className="size-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ & Quick Consultation Section */}
        {showFaq && (
          <div id="faq" className="mt-24 scroll-mt-24 rounded-3xl border border-border/60 bg-slate-50/80 p-8 sm:p-12 shadow-sm">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] items-start">
              {/* Left: Got a Question? + Email Input */}
              <Reveal>
                <div>
                  <h3 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    Got A Question<br />For Digo Academy?
                  </h3>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
                    If there are questions you want to ask, talk to our academic counsellors and we will guide you to the right track.
                  </p>

                  <form onSubmit={handleSubscribe} className="mt-8 flex items-center gap-2 max-w-md">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 rounded-full border border-border/70 bg-background px-5 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue/50 transition-shadow"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 hover:bg-slate-800 active:scale-95"
                    >
                      Submit
                    </button>
                  </form>
                </div>
              </Reveal>

              {/* Right: Clean Interactive FAQ rows */}
              <Reveal delay={150}>
                <div className="divide-y divide-border/60">
                  {FAQS.map((faq, idx) => (
                    <details
                      key={idx}
                      className="group py-5 first:pt-0 last:pb-0 cursor-pointer"
                    >
                      <summary className="flex items-center justify-between font-heading font-bold text-foreground text-sm sm:text-base list-none [&::-webkit-details-marker]:hidden">
                        <span>{faq.q}</span>
                        <ArrowRight className="size-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 group-open:rotate-90 group-open:text-brand-blue" />
                      </summary>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pr-6">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Backward compatibility alias
export const DemoReviewsAndFaq = ReviewsAndFaqSection;
