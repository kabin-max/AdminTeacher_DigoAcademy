import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';

const connectionString = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL (or DIRECT_URL) is not set — cannot seed.');
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // Find the AWS Solutions Architect Associate course
  const course = await db.course.findUnique({
    where: { id: 'seed-course-aws-saa' },
  });

  if (!course) {
    console.error('AWS Solutions Architect Associate course not found. Please run npm run db:seed first.');
    return;
  }

  // Clear existing sections for this course to avoid duplicates
  await db.section.deleteMany({
    where: { courseId: course.id }
  });

  const syllabus = [
    {
      title: 'Cloud & AWS Fundamentals',
      order: 1,
      lessons: [
        { title: 'Overview & Objectives', type: 'VIDEO', duration: 300 },
        { title: 'Core Topics', type: 'VIDEO', duration: 900 },
        { title: 'Hands-On Activities', type: 'ASSIGNMENT' },
        { title: 'Knowledge Check', type: 'QUIZ' },
      ],
    },
    {
      title: 'IAM, Accounts & Security Foundation',
      order: 2,
      lessons: [
        { title: 'IAM Users, Groups & Policies', type: 'VIDEO', duration: 1200 },
        { title: 'AWS Organizations', type: 'VIDEO', duration: 600 },
        { title: 'Create IAM Roles', type: 'ASSIGNMENT' },
        { title: 'Security Quiz', type: 'QUIZ' },
      ],
    },
    {
      title: 'VPC Networking & Hybrid Connectivity',
      order: 3,
      lessons: [
        { title: 'VPC Basics & Subnets', type: 'VIDEO', duration: 1500 },
        { title: 'NAT Gateways & Route Tables', type: 'VIDEO', duration: 800 },
        { title: 'Build a Custom VPC', type: 'ASSIGNMENT' },
        { title: 'Networking Quiz', type: 'QUIZ' },
      ],
    },
    {
      title: 'Compute: EC2, Auto Scaling & Load Balancing',
      order: 4,
      lessons: [
        { title: 'EC2 Instances & AMIs', type: 'VIDEO', duration: 1100 },
        { title: 'Application Load Balancer', type: 'VIDEO', duration: 900 },
        { title: 'Auto Scaling Groups', type: 'VIDEO', duration: 750 },
        { title: 'Deploy a Web Server', type: 'ASSIGNMENT' },
      ],
    },
    {
      title: 'Storage: S3, EBS, EFS, FSx & Backup',
      order: 5,
      lessons: [
        { title: 'S3 Storage Classes', type: 'VIDEO', duration: 1300 },
        { title: 'EBS Volumes & Snapshots', type: 'VIDEO', duration: 850 },
        { title: 'EFS vs FSx', type: 'NOTE' },
        { title: 'Storage Quiz', type: 'QUIZ' },
      ],
    },
    {
      title: 'Databases: RDS, Aurora, DynamoDB & Caching',
      order: 6,
      lessons: [
        { title: 'RDS & Multi-AZ', type: 'VIDEO', duration: 1400 },
        { title: 'DynamoDB Architecture', type: 'VIDEO', duration: 1000 },
        { title: 'ElastiCache (Redis)', type: 'VIDEO', duration: 600 },
        { title: 'Databases Quiz', type: 'QUIZ' },
      ],
    },
    {
      title: 'Resilient & Highly Available Architecture',
      order: 7,
      lessons: [
        { title: 'Route 53 & Global DNS', type: 'VIDEO', duration: 900 },
        { title: 'CloudFront CDN', type: 'VIDEO', duration: 800 },
        { title: 'Architecture Quiz', type: 'QUIZ' },
      ],
    },
    {
      title: 'Serverless, Containers & Application Integration',
      order: 8,
      lessons: [
        { title: 'AWS Lambda & API Gateway', type: 'VIDEO', duration: 1200 },
        { title: 'ECS & ECR', type: 'VIDEO', duration: 1100 },
        { title: 'SQS & SNS', type: 'NOTE' },
        { title: 'Serverless Quiz', type: 'QUIZ' },
      ],
    },
    {
      title: 'Monitoring, Governance & Operations',
      order: 9,
      lessons: [
        { title: 'CloudWatch Metrics & Alarms', type: 'VIDEO', duration: 850 },
        { title: 'CloudTrail', type: 'VIDEO', duration: 600 },
        { title: 'AWS Config', type: 'NOTE' },
        { title: 'Operations Quiz', type: 'QUIZ' },
      ],
    },
    {
      title: 'Cost Optimization & Performance Design',
      order: 10,
      lessons: [
        { title: 'Cost Explorer & Budgets', type: 'VIDEO', duration: 750 },
        { title: 'Savings Plans vs Reserved Instances', type: 'NOTE' },
        { title: 'Cost Optimization Quiz', type: 'QUIZ' },
      ],
    },
    {
      title: 'Migration, DR & Well-Architected Reviews',
      order: 11,
      lessons: [
        { title: 'Disaster Recovery Strategies', type: 'VIDEO', duration: 950 },
        { title: 'AWS Migration Hub', type: 'NOTE' },
        { title: 'Well-Architected Framework', type: 'VIDEO', duration: 1100 },
        { title: 'Final Review Quiz', type: 'QUIZ' },
      ],
    },
  ];

  console.log('Seeding syllabus for AWS Solutions Architect Associate...');

  for (const moduleData of syllabus) {
    const section = await db.section.create({
      data: {
        courseId: course.id,
        title: moduleData.title,
        order: moduleData.order,
      },
    });

    for (let i = 0; i < moduleData.lessons.length; i++) {
      const lessonData = moduleData.lessons[i];
      await db.lesson.create({
        data: {
          sectionId: section.id,
          title: lessonData.title,
          type: lessonData.type,
          order: i + 1,
          videoDurationSec: lessonData.duration,
        },
      });
    }
    
    console.log(`Created Module ${moduleData.order}: ${moduleData.title}`);
  }

  console.log('Syllabus seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
