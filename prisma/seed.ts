import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../lib/generated/prisma/client';

/**
 * Database seed — reference data only (idempotent via upsert).
 * User/course seeding lands in Phase 2 once Better Auth owns password hashing.
 *
 * Standalone client: `lib/db.ts` is `server-only` and can't be imported by a
 * plain `tsx` script, so the seed builds its own adapter-backed client.
 */
const connectionString = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL (or DIRECT_URL) is not set — cannot seed.');
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * Reference categories. Top-level entries may declare `children` (subcategories,
 * e.g. AWS -> AWS Cloud Practitioner). Admins manage the rest from the UI.
 */
const CATEGORIES: {
  name: string;
  slug: string;
  children?: { name: string; slug: string }[];
}[] = [
  {
    name: 'AWS',
    slug: 'aws',
    children: [
      { name: 'AWS Cloud Practitioner', slug: 'aws-cloud-practitioner' },
      { name: 'AWS AI Practitioner', slug: 'aws-ai-practitioner' },
      { name: 'AWS Developer Associate', slug: 'aws-developer' },
      { name: 'AWS Solutions Architect', slug: 'aws-solutions-architect' },
      { name: 'AWS CloudOps Architect', slug: 'aws-cloudops-architect' },
      { name: 'AWS DevOps Engineer Professional', slug: 'aws-devops-engineer' },
    ],
  },
];

const SETTINGS: { key: string; value: unknown }[] = [
  // Admin can force full re-approval instead of a lightweight re-review flag (Phase 4).
  { key: 'course.reReviewPolicy', value: { forceFullReapproval: false } },
  // Assignment pass mark is fixed at 80% (Phase 7); surfaced here for admin visibility.
  { key: 'grading.assignmentPassThreshold', value: 80 },
];

/**
 * Demo instructors. Created as plain User rows (no Better Auth credential, so they
 * can't sign in) purely to author showcase courses and populate the public site.
 */
const INSTRUCTORS: {
  email: string;
  name: string;
  headline: string;
  ratingAvg: number;
  totalStudents: number;
}[] = [
  { email: 'aisha.rahman@demo.digo.academy', name: 'Aisha Rahman', headline: 'Senior Frontend Engineer', ratingAvg: 4.9, totalStudents: 3200 },
  { email: 'daniel.osei@demo.digo.academy', name: 'Daniel Osei', headline: 'Data Scientist & ML Engineer', ratingAvg: 4.8, totalStudents: 2600 },
  { email: 'maria.souza@demo.digo.academy', name: 'Maria Souza', headline: 'Product Designer', ratingAvg: 4.7, totalStudents: 1900 },
  { email: 'james.park@demo.digo.academy', name: 'James Park', headline: 'Cloud Architect (AWS)', ratingAvg: 4.8, totalStudents: 2100 },
  { email: 'liam.chen@demo.digo.academy', name: 'Liam Chen', headline: 'Growth Marketer', ratingAvg: 4.5, totalStudents: 1400 },
];

type SeedDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

/**
 * Showcase courses, all PUBLISHED so they surface on the public homepage/catalog.
 * `id` is fixed so re-seeding is idempotent; ratings are pre-set (cached aggregate)
 * so "top rated" ordering has something to sort on without seeding reviews.
 */
const COURSES: {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  categorySlug: string;
  instructorEmail: string;
  difficulty: SeedDifficulty;
  priceCents: number;
  language: string;
  ratingAvg: number;
  sections: { title: string; lessons: { title: string; type: 'VIDEO' | 'NOTE'; durationSec?: number }[] }[];
}[] = [
  {
    id: 'seed-course-aws-cp',
    title: 'AWS Cloud Practitioner',
    subtitle: 'Pass the CLF-C02 exam and understand the AWS core.',
    description: '<p>Everything you need to confidently pass the AWS Cloud Practitioner exam.</p>',
    categorySlug: 'aws-cloud-practitioner',
    instructorEmail: 'james.park@demo.digo.academy',
    difficulty: 'BEGINNER',
    priceCents: 6900,
    language: 'en',
    ratingAvg: 4.9,
    sections: [
      { title: 'Cloud concepts', lessons: [ { title: 'What is the cloud', type: 'VIDEO', durationSec: 480 }, { title: 'AWS global infrastructure', type: 'VIDEO', durationSec: 600 } ] },
      { title: 'Core services', lessons: [ { title: 'EC2 & S3', type: 'VIDEO', durationSec: 900 }, { title: 'Exam tips', type: 'NOTE' } ] },
    ],
  },
  {
    id: 'seed-course-aws-ai',
    title: 'AWS AI Practitioner',
    subtitle: 'Master AI on AWS and generative AI foundations.',
    description: '<p>Learn to build and deploy AI solutions on AWS effectively.</p>',
    categorySlug: 'aws-ai-practitioner',
    instructorEmail: 'james.park@demo.digo.academy',
    difficulty: 'BEGINNER',
    priceCents: 6900,
    language: 'en',
    ratingAvg: 4.8,
    sections: [
      { title: 'AI Foundations', lessons: [ { title: 'Intro to GenAI', type: 'VIDEO', durationSec: 480 } ] },
    ],
  },
  {
    id: 'seed-course-aws-dev',
    title: 'AWS Developer - Associate',
    subtitle: 'Develop robust, scalable cloud applications on AWS.',
    description: '<p>Comprehensive training for the DVA-C02 exam.</p>',
    categorySlug: 'aws-developer',
    instructorEmail: 'james.park@demo.digo.academy',
    difficulty: 'INTERMEDIATE',
    priceCents: 7900,
    language: 'en',
    ratingAvg: 4.8,
    sections: [
      { title: 'Serverless Compute', lessons: [ { title: 'AWS Lambda', type: 'VIDEO', durationSec: 480 } ] },
    ],
  },
  {
    id: 'seed-course-aws-saa',
    title: 'AWS Solutions Architect - Associate',
    subtitle: 'Design high-performing, secure AWS architectures.',
    description: '<p>Pass the SAA-C03 exam with hands-on architecture labs.</p>',
    categorySlug: 'aws-solutions-architect',
    instructorEmail: 'james.park@demo.digo.academy',
    difficulty: 'INTERMEDIATE',
    priceCents: 7900,
    language: 'en',
    ratingAvg: 4.9,
    sections: [
      { title: 'VPC & Networking', lessons: [ { title: 'VPC Basics', type: 'VIDEO', durationSec: 480 } ] },
    ],
  },
  {
    id: 'seed-course-aws-cloudops',
    title: 'AWS CloudOps Architect - Associate',
    subtitle: 'Operate and maintain scalable AWS environments.',
    description: '<p>Learn monitoring, automation, and operational excellence on AWS.</p>',
    categorySlug: 'aws-cloudops-architect',
    instructorEmail: 'james.park@demo.digo.academy',
    difficulty: 'INTERMEDIATE',
    priceCents: 7900,
    language: 'en',
    ratingAvg: 4.8,
    sections: [
      { title: 'Monitoring', lessons: [ { title: 'CloudWatch', type: 'VIDEO', durationSec: 480 } ] },
    ],
  },
  {
    id: 'seed-course-aws-devops',
    title: 'AWS DevOps Engineer - Professional',
    subtitle: 'Master CI/CD, automation, and DevOps on AWS.',
    description: '<p>Advanced training for the DOP-C02 exam.</p>',
    categorySlug: 'aws-devops-engineer',
    instructorEmail: 'james.park@demo.digo.academy',
    difficulty: 'ADVANCED',
    priceCents: 12900,
    language: 'en',
    ratingAvg: 4.9,
    sections: [
      { title: 'CI/CD Pipelines', lessons: [ { title: 'CodePipeline', type: 'VIDEO', durationSec: 480 } ] },
    ],
  },
];

async function main() {
  for (const category of CATEGORIES) {
    const parent = await db.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { name: category.name, slug: category.slug },
    });

    for (const child of category.children ?? []) {
      // If there's an existing category with the same name under this parent
      // but a DIFFERENT slug, it will cause a unique constraint violation when
      // we try to update the current slug to this new name. We remove it first.
      const existingByName = await db.category.findFirst({
        where: { parentId: parent.id, name: child.name }
      });

      if (existingByName && existingByName.slug !== child.slug) {
        await db.category.delete({ where: { id: existingByName.id } });
      }

      await db.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: { name: child.name, slug: child.slug, parentId: parent.id },
      });
    }
  }

  for (const setting of SETTINGS) {
    await db.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value as object },
      create: { key: setting.key, value: setting.value as object },
    });
  }

  // Demo instructors (plain User rows + profiles; no login credential).
  const instructorIdByEmail = new Map<string, string>();
  for (const instructor of INSTRUCTORS) {
    const user = await db.user.upsert({
      where: { email: instructor.email },
      update: { name: instructor.name, role: 'INSTRUCTOR' },
      create: {
        email: instructor.email,
        name: instructor.name,
        role: 'INSTRUCTOR',
        emailVerified: true,
      },
    });
    instructorIdByEmail.set(instructor.email, user.id);

    await db.instructorProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: instructor.headline,
        ratingAvg: instructor.ratingAvg,
        totalStudents: instructor.totalStudents,
      },
      create: {
        userId: user.id,
        headline: instructor.headline,
        ratingAvg: instructor.ratingAvg,
        totalStudents: instructor.totalStudents,
      },
    });
  }

  // Category id lookup by slug (leaf slugs included).
  const categories = await db.category.findMany({ select: { id: true, slug: true } });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  // Clean up any old seed courses that are no longer in our list
  const currentSeedCourseIds = COURSES.map(c => c.id);
  await db.course.deleteMany({
    where: {
      id: {
        startsWith: 'seed-course-',
        notIn: currentSeedCourseIds
      }
    }
  });

  // Showcase courses with curriculum. Sections are rebuilt each run for idempotency.
  for (const course of COURSES) {
    const instructorId = instructorIdByEmail.get(course.instructorEmail);
    const categoryId = categoryIdBySlug.get(course.categorySlug) ?? null;
    if (!instructorId) continue;

    await db.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        categoryId,
        instructorId,
        difficulty: course.difficulty,
        priceCents: course.priceCents,
        language: course.language,
        ratingAvg: course.ratingAvg,
        status: 'PUBLISHED',
      },
      create: {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        categoryId,
        instructorId,
        difficulty: course.difficulty,
        priceCents: course.priceCents,
        currency: 'USD',
        language: course.language,
        ratingAvg: course.ratingAvg,
        status: 'PUBLISHED',
      },
    });

    // Rebuild curriculum (cascade deletes lessons) so re-seeding stays clean.
    await db.section.deleteMany({ where: { courseId: course.id } });
    for (const [sectionIndex, section] of course.sections.entries()) {
      await db.section.create({
        data: {
          courseId: course.id,
          title: section.title,
          order: sectionIndex,
          lessons: {
            create: section.lessons.map((lesson, lessonIndex) => ({
              title: lesson.title,
              type: lesson.type,
              order: lessonIndex,
              videoDurationSec: lesson.durationSec ?? null,
            })),
          },
        },
      });
    }
  }

  console.log(
    `Seed complete: ${CATEGORIES.length} categories, ${SETTINGS.length} platform settings, ${INSTRUCTORS.length} instructors, ${COURSES.length} courses.`
  );
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
