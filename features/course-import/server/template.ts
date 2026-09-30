import 'server-only';

import { Document, HeadingLevel, Packer, Paragraph } from 'docx';

/**
 * A downloadable `.docx` starter that mirrors exactly the structure
 * `parse.ts` expects (see its file-level doc comment): an ALL-CAPS title
 * paragraph, a plain-text description paragraph, then one or more modules —
 * each a "MODULE NN" marker paragraph, a Heading 1 title, an overview
 * paragraph, and Heading 2 sections for Learning Objectives (a bullet list),
 * Core Topics / Hands-On Activities (Heading 3 + paragraph pairs), and a
 * Knowledge Check (numbered questions, lettered choices with a ✓ on the
 * correct one, and an "Explanation:" line).
 *
 * Ships two worked modules so the repeating pattern is obvious, rather than
 * one module that could read as a one-off example.
 */
export async function buildCourseImportTemplate(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'CLOUD PRACTITIONER FUNDAMENTALS' }),
          new Paragraph({
            text: 'A foundational course covering core cloud concepts, service models, and everyday best practices.',
          }),

          ...module1(),
          ...module2(),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function heading2(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
}

function heading3(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3 });
}

function bullet(text: string) {
  return new Paragraph({ text, bullet: { level: 0 } });
}

function module1(): Paragraph[] {
  return [
    new Paragraph({ text: 'MODULE 01' }),
    new Paragraph({ text: 'Introduction to Cloud Computing', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: 'This module introduces core cloud computing concepts, service models, and deployment models.',
    }),

    heading2('Learning Objectives'),
    bullet('Define cloud computing and explain how it differs from on-premises infrastructure'),
    bullet('Identify the three cloud service models: IaaS, PaaS, and SaaS'),
    bullet('Compare public, private, and hybrid deployment models'),

    heading2('Core Topics'),
    heading3('What Is Cloud Computing?'),
    new Paragraph({
      text: 'Cloud computing is the on-demand delivery of compute power, storage, and other IT resources over the internet, with pay-as-you-go pricing.',
    }),
    heading3('Service Models'),
    new Paragraph({
      text: 'IaaS provides raw infrastructure, PaaS provides a managed platform for building applications, and SaaS delivers complete, ready-to-use applications.',
    }),

    heading2('Hands-On Activities'),
    heading3('Activity: Explore a Cloud Console'),
    new Paragraph({
      text: 'Sign in to a free-tier cloud console and locate the compute, storage, and billing dashboards.',
    }),

    heading2('Knowledge Check'),
    new Paragraph({ text: '1. Which of the following best describes cloud computing?' }),
    new Paragraph({ text: 'A. A single physical server located on-premises' }),
    new Paragraph({ text: 'B. On-demand delivery of IT resources over the internet ✓' }),
    new Paragraph({ text: 'C. A type of programming language' }),
    new Paragraph({ text: 'D. A backup tape drive' }),
    new Paragraph({
      text: 'Explanation: Cloud computing refers to the on-demand delivery of compute, storage, and other IT resources over the internet.',
    }),
    new Paragraph({ text: '2. Which service model gives you the most control over the underlying OS?' }),
    new Paragraph({ text: 'A. SaaS' }),
    new Paragraph({ text: 'B. PaaS' }),
    new Paragraph({ text: 'C. IaaS ✓' }),
    new Paragraph({
      text: 'Explanation: IaaS provides raw virtual machines, so you manage the OS and everything above it.',
    }),
  ];
}

function module2(): Paragraph[] {
  return [
    new Paragraph({ text: 'MODULE 02' }),
    new Paragraph({ text: 'Cloud Security Basics', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: 'This module covers the shared responsibility model and foundational security practices in the cloud.',
    }),

    heading2('Learning Objectives'),
    bullet('Explain the shared responsibility model'),
    bullet('Describe the principle of least privilege'),

    heading2('Core Topics'),
    heading3('Shared Responsibility Model'),
    new Paragraph({
      text: 'The cloud provider secures the infrastructure; the customer is responsible for securing their data, identities, and configurations on top of it.',
    }),

    heading2('Hands-On Activities'),
    heading3('Activity: Review IAM Permissions'),
    new Paragraph({
      text: 'Open the identity and access management console and review which users have administrator access.',
    }),

    heading2('Knowledge Check'),
    new Paragraph({ text: '1. Under the shared responsibility model, who secures the physical data centers?' }),
    new Paragraph({ text: 'A. The customer' }),
    new Paragraph({ text: 'B. The cloud provider ✓' }),
    new Paragraph({ text: 'C. A third-party auditor' }),
    new Paragraph({
      text: 'Explanation: The cloud provider is always responsible for physical and infrastructure-level security.',
    }),
  ];
}
