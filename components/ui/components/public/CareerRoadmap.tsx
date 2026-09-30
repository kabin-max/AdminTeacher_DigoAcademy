'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  Code,
  Settings,
  GitBranch,
  Database,
  BrainCircuit,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Shield,
  Layers,
  Award
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import cloudPractitionerImg from './Cert/cloudPractitioner.png';
import developerAssociateImg from './Cert/developerAssociate.png';
import devopsEngineerProfessionalImg from './Cert/devopsEngineerProfessional.png';
import solutionArchitectAssociateImg from './Cert/solutionArchitectAssociate.png';
import solutionArchitectProfessionalImg from './Cert/solutionArchitectProfessional.png';
import aiPractitionerImg from './Cert/AI_practitioner.png';
import cloudOpsEngineerImg from './Cert/cloudops_logo-removebg-preview.png';
import dataEngineerImg from './Cert/data engineer logo.png';
import machineLearningEngineerImg from './Cert/machinelearning associate.png';

const certImages: Record<string, any> = {
  'AWS Certified Cloud Practitioner': cloudPractitionerImg,
  'AWS Certified Solutions Architect - Associate': solutionArchitectAssociateImg,
  'AWS Certified Solutions Architect - Professional': solutionArchitectProfessionalImg,
  'AWS Certified Developer - Associate': developerAssociateImg,
  'AWS Certified DevOps Engineer - Professional': devopsEngineerProfessionalImg,
  'AWS Certified AI Practitioner': aiPractitionerImg,
  'AWS Certified Developer - Associate or CloudOps Engineer - Associate': developerAssociateImg,
  'AWS Certified CloudOps Engineer - Associate': cloudOpsEngineerImg,
  'AWS Certified Data Engineer - Associate': dataEngineerImg,
  'AWS Certified Machine Learning Engineer - Associate': machineLearningEngineerImg,
};

import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';

type PathId = 'architecture' | 'development' | 'operations' | 'devops' | 'data' | 'ai';

interface CareerPath {
  id: PathId;
  title: string;
  role: string;
  description: string;
  icon: any;
  certifications: string[];
  skills: string[];
  courses: string[];
  color: string;
}

const CAREER_PATHS: CareerPath[] = [
  {
    id: 'architecture',
    title: 'Cloud & Architecture',
    role: 'Solutions Architect',
    description: 'Build toward cloud architecture and infrastructure design roles.',
    icon: Cloud,
    certifications: [
      'AWS Certified Cloud Practitioner',
      'AWS Certified Solutions Architect - Associate',
      'AWS Certified Solutions Architect - Professional'
    ],
    skills: ['Cloud Architecture', 'Networking', 'Security', 'High Availability', 'Cost Optimization', 'Infrastructure Design'],
    courses: ['AWS Cloud Practitioner', 'AWS Solutions Architect - Associate', 'AWS Solutions Architect - Professional'],
    color: 'bg-blue-500 text-white shadow-blue-500/20'
  },
  {
    id: 'development',
    title: 'Cloud Development',
    role: 'Cloud Developer',
    description: 'Develop, deploy, and maintain applications on AWS.',
    icon: Code,
    certifications: [
      'AWS Certified Cloud Practitioner',
      'AWS Certified Developer - Associate',
      'AWS Certified DevOps Engineer - Professional'
    ],
    skills: ['Programming', 'APIs', 'AWS Services', 'Application Development', 'CI/CD', 'Containers'],
    courses: ['AWS Cloud Practitioner', 'AWS Developer - Associate', 'AWS DevOps Engineer - Professional'],
    color: 'bg-indigo-500 text-white shadow-indigo-500/20'
  },
  {
    id: 'operations',
    title: 'Cloud Operations',
    role: 'Cloud Operations Engineer',
    description: 'Learn to deploy, operate, monitor, and maintain AWS workloads.',
    icon: Settings,
    certifications: [
      'AWS Certified Cloud Practitioner',
      'AWS Certified CloudOps Engineer - Associate'
    ],
    skills: ['AWS Operations', 'Monitoring', 'Networking', 'Security', 'Reliability', 'Automation'],
    courses: ['AWS Cloud Practitioner', 'AWS CloudOps Engineer - Associate'],
    color: 'bg-cyan-500 text-white shadow-cyan-500/20'
  },
  {
    id: 'devops',
    title: 'DevOps',
    role: 'DevOps Engineer',
    description: 'Progress from cloud development and operations into advanced DevOps practices.',
    icon: GitBranch,
    certifications: [
      'AWS Certified Developer - Associate or CloudOps Engineer - Associate',
      'AWS Certified DevOps Engineer - Professional'
    ],
    skills: ['Linux', 'Git', 'CI/CD', 'Docker', 'Infrastructure as Code', 'Automation', 'AWS', 'Monitoring', 'Containers'],
    courses: ['AWS Developer / CloudOps', 'AWS DevOps Engineer - Professional'],
    color: 'bg-violet-500 text-white shadow-violet-500/20'
  },
  {
    id: 'data',
    title: 'Data Engineering',
    role: 'Data Engineer',
    description: 'Build skills for designing and operating cloud-based data solutions.',
    icon: Database,
    certifications: [
      'AWS Certified Cloud Practitioner',
      'AWS Certified Data Engineer - Associate'
    ],
    skills: ['Data Pipelines', 'Databases', 'ETL', 'Data Lakes', 'Analytics', 'Data Processing'],
    courses: ['AWS Cloud Practitioner', 'AWS Data Engineer - Associate'],
    color: 'bg-sky-500 text-white shadow-sky-500/20'
  },
  {
    id: 'ai',
    title: 'AI / Machine Learning',
    role: 'Machine Learning Engineer',
    description: 'Build practical skills around AI and machine learning workloads on AWS.',
    icon: BrainCircuit,
    certifications: [
      'AWS Certified AI Practitioner',
      'AWS Certified Machine Learning Engineer - Associate'
    ],
    skills: ['AI Fundamentals', 'Machine Learning', 'Data', 'Model Deployment', 'AWS AI Services', 'MLOps Fundamentals'],
    courses: ['AWS AI Practitioner', 'AWS Machine Learning Engineer - Associate'],
    color: 'bg-blue-600 text-white shadow-blue-600/20'
  }
];

export function CareerRoadmap() {
  const [activePath, setActivePath] = useState<PathId | null>(null);

  const selectedPath = activePath ? CAREER_PATHS.find((p) => p.id === activePath) : null;

  return (
    <section className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto font-sans">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
          Where Can Your Cloud Skills Take You?
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed">
          Explore career paths, discover the skills behind each role, and follow a structured learning journey at Digo Academy.
        </p>
      </div>

      <div className="relative mb-24">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

          {/* Roadmap Selector */}
          <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-end relative z-10">
            {/* Foundation Node */}
            <div className="w-full max-w-sm mb-8 lg:mb-12 group cursor-pointer" onClick={() => setActivePath(null)}>
              <div className={cn(
                "relative p-6 rounded-2xl border-2 transition-all duration-300",
                activePath === null
                  ? "border-brand-blue bg-white shadow-xl shadow-brand-blue/10 scale-105 z-10"
                  : "border-slate-200 bg-slate-50/80 hover:border-brand-blue/50 hover:bg-white"
              )}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-brand-blue to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Layers className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">AWS FOUNDATIONS</h3>
                    <p className="text-sm text-brand-blue font-medium">Start Here</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Build a strong foundation in AWS before choosing your specialization.
                </p>
              </div>
            </div>

            {/* Branching Paths */}
            <div className="w-full max-w-sm flex flex-col gap-4 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-px bg-slate-200 translate-x-8 -translate-y-12"></div>

              {CAREER_PATHS.map((path, index) => {
                const isActive = activePath === path.id;
                const Icon = path.icon;

                return (
                  <div key={path.id} className="relative w-full">
                    {/* Horizontal connector to line */}
                    <div className="hidden lg:block absolute right-0 top-1/2 w-8 h-px bg-slate-200 translate-x-8"></div>
                    {isActive && (
                      <motion.div
                        layoutId="active-connector"
                        className="hidden lg:block absolute right-0 top-1/2 w-8 h-0.5 bg-brand-blue translate-x-8 z-10"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => setActivePath(path.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 group relative overflow-hidden",
                        isActive
                          ? "border-transparent bg-white shadow-xl scale-[1.02] z-10"
                          : "border-slate-200 bg-white hover:border-brand-blue/30 hover:shadow-md opacity-80 hover:opacity-100"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-bg"
                          className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-brand-blue/30 rounded-xl"
                        />
                      )}
                      <div className={cn(
                        "relative size-10 rounded-lg flex items-center justify-center shadow-sm transition-colors",
                        isActive ? path.color : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      )}>
                        <Icon className="size-5" />
                      </div>
                      <div className="relative flex-1">
                        <h4 className={cn("font-semibold text-sm sm:text-base transition-colors", isActive ? "text-brand-blue" : "text-slate-700 group-hover:text-slate-900")}>
                          {path.title}
                        </h4>
                      </div>
                      <ChevronRight className={cn("relative size-5 transition-transform", isActive ? "text-brand-blue translate-x-1" : "text-slate-300 group-hover:text-slate-400")} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Path Details */}
          <div className="w-full lg:w-2/3 mt-8 lg:mt-0 lg:pl-16 relative">
            <AnimatePresence mode="wait">
              {activePath === null ? (
                <motion.div
                  key="foundation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl shadow-slate-200/50"
                >
                  <div className="mb-8">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest mb-4">
                      Core Concept
                    </span>
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">Cloud Foundations</h3>
                    <p className="text-lg text-slate-600">The essential first step for any cloud career.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8 mb-10">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Shield className="size-4 text-brand-blue" />
                        Target Certification
                      </h4>
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <div className="flex gap-4 items-center">
                          <div className="shrink-0 w-14 h-14 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                            <Image src={certImages['AWS Certified Cloud Practitioner']} alt="AWS Certified Cloud Practitioner" className="w-full h-full object-contain p-1" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">AWS Certified</p>
                            <p className="text-slate-600 text-sm">Cloud Practitioner</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-brand-blue" />
                        Core Skills
                      </h4>
                      <ul className="grid grid-cols-1 gap-2">
                        {['Cloud Fundamentals', 'AWS Core Services', 'Security Basics', 'Cloud Concepts', 'Pricing & Cost Awareness'].map((skill, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                            <div className="size-1.5 rounded-full bg-brand-blue" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Recommended Course</p>
                      <p className="font-semibold text-slate-900">AWS Cloud Practitioner</p>
                    </div>
                    <Button
                      className="bg-brand-blue hover:bg-brand-blue/90 rounded-full px-8"
                      render={
                        <Link href="/courses">
                          <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                            Explore Courses <ArrowRight className="size-4" />
                          </span>
                        </Link>
                      }
                    />
                  </div>
                </motion.div>
              ) : (
                selectedPath && (
                  <motion.div
                    key={selectedPath.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl shadow-slate-200/50"
                  >
                    <div className="mb-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold uppercase tracking-widest">
                          {selectedPath.title}
                        </span>
                        <button
                          onClick={() => setActivePath(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                        >
                          Reset View
                        </button>
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{selectedPath.role}</h3>
                      <p className="text-lg text-slate-600">{selectedPath.description}</p>
                    </div>

                    <div className="space-y-10">
                      {/* Certification Journey */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                          <Award className="size-4 text-brand-blue" />
                          Certification Journey
                        </h4>
                        <div className="relative">
                          <div className="absolute left-[23px] top-8 bottom-8 w-px bg-slate-200"></div>
                          <div className="space-y-6">
                            {selectedPath.certifications.map((cert, i) => (
                              <div key={i} className="relative flex gap-6">
                                {certImages[cert] ? (
                                  <div className="shrink-0 w-12 h-12 relative z-10 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                                    <Image src={certImages[cert]} alt={cert} className="w-full h-full object-contain p-1" />
                                  </div>
                                ) : (
                                  <div className={cn(
                                    "shrink-0 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center font-bold text-sm z-10 shadow-sm",
                                    i === selectedPath.certifications.length - 1
                                      ? selectedPath.color
                                      : "bg-slate-100 text-slate-500"
                                  )}>
                                    0{i + 1}
                                  </div>
                                )}
                                <div className="pt-2.5">
                                  {cert.split(' - ').length > 1 ? (
                                    <>
                                      <p className="font-semibold text-slate-900">{cert.split(' - ')[0]}</p>
                                      <p className={cn("text-sm font-medium",
                                        i === selectedPath.certifications.length - 1 ? "text-brand-blue" : "text-slate-500"
                                      )}>
                                        {cert.split(' - ')[1]}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="font-semibold text-slate-900 leading-snug pt-0.5">{cert}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                        {/* Core Skills */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Settings className="size-4 text-brand-blue" />
                            Core Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedPath.skills.map((skill, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Related Courses */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Code className="size-4 text-brand-blue" />
                            Digo Academy Learning
                          </h4>
                          <ul className="space-y-3">
                            {selectedPath.courses.map((course, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <ChevronRight className="size-4 text-brand-blue mt-0.5 shrink-0" />
                                <span className="text-sm font-medium text-slate-700">{course}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-8">
                        <Button
                          className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue/90 rounded-full px-8 h-12 text-base"
                          render={
                            <Link href="/courses">
                              <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                                Explore {selectedPath.title} Path <ArrowRight className="size-4" />
                              </span>
                            </Link>
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
