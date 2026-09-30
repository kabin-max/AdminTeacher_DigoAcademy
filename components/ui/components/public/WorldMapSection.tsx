'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { Calendar, Compass, Cpu, MapPin, Search, Trophy } from 'lucide-react';

import { Reveal } from '@/shared/components/public/Reveal';

const FEATURES = [
  {
    icon: Compass,
    title: 'Diverse Tech Tracks',
    desc: 'From full-stack Next.js and Cloud architectures to Autonomous AI Agents and LLM orchestration.',
    color: 'bg-emerald-500/10 text-emerald-600',
    border: 'hover:border-emerald-200',
  },
  {
    icon: Cpu,
    title: 'Senior Code Mentors',
    desc: 'Staff engineers and tech leads personally reviewing your Git commits and architecture design docs.',
    color: 'bg-brand-blue/10 text-brand-blue',
    border: 'hover:border-brand-blue/30',
  },
  {
    icon: Trophy,
    title: 'Career Placement & Demo Days',
    desc: 'Present your deployed microservices directly to hiring partners, tech founders, and CTOs.',
    color: 'bg-amber-500/10 text-amber-600',
    border: 'hover:border-amber-200',
  },
];

type Region = 'all' | 'remote' | 'sv' | 'global';

interface Hub {
  id: string;
  name: string;
  role: string;
  region: Exclude<Region, 'all'>;
  top: string;
  left: string;
  featured?: boolean;
}

/**
 * Positions are equirectangular projections of real coordinates onto the map's
 * 1000x500 viewBox, so they stay accurate as long as the container keeps the
 * artwork's 2:1 ratio: left = (lon + 180) / 360, top = (90 - lat) / 180.
 */
const ALUMNI_HUBS: Hub[] = [
  { id: 'sv', name: 'Silicon Valley, USA', role: 'AI & YC Startups', region: 'sv', top: '29.2%', left: '16.1%' },
  { id: 'sa', name: 'São Paulo, Brazil', role: 'FinTech Remote Hub', region: 'remote', top: '63.1%', left: '37.1%' },
  { id: 'eu', name: 'London & Berlin', role: 'Autonomous Systems', region: 'global', top: '21.4%', left: '50%' },
  { id: 'af', name: 'Nairobi, Kenya', role: 'Emerging Tech Squad', region: 'remote', top: '50.7%', left: '60.2%' },
  {
    id: 'ktm',
    name: 'Kathmandu',
    role: 'Digo Academy HQ',
    region: 'global',
    top: '34.6%',
    left: '73.7%',
    featured: true,
  },
  { id: 'asia', name: 'Tokyo & Singapore', role: 'Cloud Infrastructure', region: 'global', top: '30.2%', left: '88.8%' },
  { id: 'syd', name: 'Sydney, Australia', role: 'Product Engineering', region: 'global', top: '68.8%', left: '92%' },
];

const REGION_FILTERS: { key: Region; label: string }[] = [
  { key: 'all', label: 'All hubs' },
  { key: 'remote', label: 'Remote' },
  { key: 'sv', label: 'Silicon Valley' },
  { key: 'global', label: 'Global' },
];

const STATS = [
  { value: '1,000+', label: 'Students worldwide' },
  { value: '24', label: 'Countries' },
  { value: '7', label: 'Regional hubs' },
];

export interface WorldMapSectionProps {
  showFeatures?: boolean;
}

export function WorldMapSection({ showFeatures = false }: WorldMapSectionProps = {}) {
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  // Only run the pinned center-to-left choreography on wide viewports.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const animateComposition = isDesktop && !reduceMotion;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  // Smooth the raw scroll value so the movement reads as one deliberate gesture.
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

  // Map travels from centered to the left column, then holds its final position.
  const mapShift = useTransform(progress, [0, 0.55], ['0%', '-31%']);
  const mapScale = useTransform(progress, [0, 0.55], [1, 0.94]);

  // Copy enters from the right, synchronized with the map's travel.
  const copyShift = useTransform(progress, [0.1, 0.55], [56, 0]);
  const copyOpacity = useTransform(progress, [0.14, 0.5], [0, 1]);

  const mapStyle = animateComposition ? { x: mapShift, scale: mapScale } : undefined;
  const copyStyle = animateComposition ? { x: copyShift, opacity: copyOpacity } : undefined;

  return (
    <section className="bg-background">
      {showFeatures && (
        <div className="mx-auto w-full max-w-7xl px-6 pt-24 lg:px-10">
          <div className="grid items-start gap-12 border-b border-border pb-20 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                That&apos;s The Way
                <br />
                To Build!
              </h2>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Try a proven pedagogy designed around software agency, code ownership, and real-time
                guidance.
              </p>
            </Reveal>

            <Reveal delay={150}>
              <div className="grid gap-6 sm:grid-cols-3">
                {FEATURES.map((feat) => (
                  <div
                    key={feat.title}
                    className={`rounded-2xl border border-border bg-card p-6 transition-colors duration-200 ${feat.border}`}
                  >
                    <div className={`flex size-11 items-center justify-center rounded-xl ${feat.color}`}>
                      <feat.icon className="size-5" />
                    </div>
                    <h3 className="mt-5 font-heading text-sm font-bold leading-snug text-foreground">
                      {feat.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      )}

      {/* Scroll track: tall on desktop so the pinned stage has room to choreograph. */}
      <div ref={trackRef} className="relative lg:h-[240vh]">
        <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center">
          <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-0">
            {/* Heading — aligned to the page grid, consistent rhythm below. */}
            <header className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                Remote, Silicon Valley, Global.
                <span className="mt-2 block text-muted-foreground">Where will you build?</span>
              </h2>
            </header>

            {/* Stage: map starts centered, shifts left while copy enters right. */}
            <div className="relative mt-16 lg:mt-20">
              <motion.div style={mapStyle} className="mx-auto w-full max-w-[44rem] will-change-transform">
                <WorldMap
                  hubs={ALUMNI_HUBS}
                  activeRegion={activeRegion}
                  selectedHub={selectedHub}
                  onSelectHub={setSelectedHub}
                  draggable={!reduceMotion}
                />
              </motion.div>

              <motion.div
                style={copyStyle}
                className="mt-14 lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:flex lg:w-[33%] lg:flex-col lg:justify-center"
              >
                <p className="max-w-md text-base leading-[1.7] text-muted-foreground">
                  We have <span className="font-semibold text-foreground">students across the globe</span>{' '}
                  learning from Silicon Valley and London to Nairobi and Kathmandu, across top
                  startups, engineering studios, and remote squads. 
                </p>

                <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
                  {STATS.map((stat) => (
                    <div key={stat.label}>
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="block font-heading text-2xl font-bold tracking-tight text-foreground">
                          {stat.value}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                          {stat.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>

            

               
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorldMap({
  hubs,
  activeRegion,
  selectedHub,
  onSelectHub,
  draggable,
}: {
  hubs: Hub[];
  activeRegion: Region;
  selectedHub: Hub | null;
  onSelectHub: (hub: Hub | null) => void;
  draggable: boolean;
}) {
  return (
    <figure className="relative">
      <motion.div
        drag={draggable ? 'x' : false}
        dragConstraints={{ left: -64, right: 64 }}
        dragElastic={0.08}
        className={`relative aspect-2/1 w-full ${
          draggable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <img
          src="/world-map-dots.svg"
          alt="World map showing Digo Academy alumni hubs"
          className="pointer-events-none size-full select-none object-contain opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_72%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_72%,transparent_100%)] dark:opacity-50"
          draggable={false}
        />

        {hubs.map((hub) => {
          const isMuted = activeRegion !== 'all' && hub.region !== activeRegion;
          const isSelected = selectedHub?.id === hub.id;

          return (
            <button
              key={hub.id}
              type="button"
              style={{ top: hub.top, left: hub.left }}
              onClick={() => onSelectHub(isSelected ? null : hub)}
              onMouseEnter={() => onSelectHub(hub)}
              onMouseLeave={() => onSelectHub(null)}
              aria-label={`${hub.name} — ${hub.role}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${
                isMuted ? 'opacity-25' : 'opacity-100'
              }`}
            >
              <span className="relative flex items-center justify-center">
                <span
                  className={`rounded-full border-2 border-background bg-brand-blue transition-transform duration-200 ${
                    hub.featured ? 'size-4' : 'size-3'
                  } ${isSelected ? 'scale-125' : ''}`}
                />
                {hub.featured && (
                  <span className="absolute size-7 rounded-full border border-brand-blue/35" aria-hidden="true" />
                )}
              </span>

              <span
                className={`pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-left shadow-sm transition-opacity duration-200 ${
                  isSelected ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="block text-xs font-bold text-foreground">{hub.name}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">{hub.role}</span>
              </span>
            </button>
          );
        })}
      </motion.div>

      
    </figure>
  );
}

// Backward compatibility alias
export const DemoWorldMap = WorldMapSection;
