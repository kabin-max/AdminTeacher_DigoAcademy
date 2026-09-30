import 'server-only';

import { ENROLLMENT_MODE_LABELS, type EnrollmentMode } from '@/features/enrollment/schemas';
import { sendEmail } from '@/lib/email';
import { renderEmail, type EmailContent } from '@/lib/email-template';
import { env } from '@/lib/env';

/**
 * Enrollment-lifecycle notification emails (branded HTML + text fallback). All
 * sends are best-effort: a mail failure (incl. "no provider configured" in prod)
 * is logged, never thrown, so it can't break the action that triggered it.
 */

const DASHBOARD_URL = `${env.BETTER_AUTH_URL}/student`;

async function safeSend(to: string, subject: string, content: EmailContent): Promise<void> {
  try {
    const { html, text } = renderEmail(content);
    await sendEmail({ to, subject, text, html });
  } catch (error) {
    console.error('[enrollment email] failed:', subject, error);
  }
}

/** 1) Learner submitted an enrollment request (inquiry created). */
export async function sendInquiryReceivedEmail(p: {
  to: string;
  name: string;
  courseTitle: string;
  mode: EnrollmentMode;
}): Promise<void> {
  await safeSend(p.to, `We received your enrollment request — ${p.courseTitle}`, {
    heading: 'Request received 🎉',
    intro: `Hi ${p.name},`,
    paragraphs: [
      `Thanks for your interest in “${p.courseTitle}” (${ENROLLMENT_MODE_LABELS[p.mode]}).`,
      `We've received your enrollment request. Our team will review it and reach out shortly to help you complete enrollment.`,
    ],
  });
}

/** 2) Admin approved the request (inquiry reached CONFIRMED). */
export async function sendInquiryApprovedEmail(p: {
  to: string;
  name: string;
  courseTitle: string;
}): Promise<void> {
  await safeSend(p.to, `Your enrollment request is approved — ${p.courseTitle}`, {
    heading: 'Your request is approved ✅',
    intro: `Hi ${p.name},`,
    paragraphs: [
      `Good news — your request to join “${p.courseTitle}” has been approved.`,
      `We'll assign you to a cohort and confirm your enrollment shortly.`,
    ],
  });
}

/** 3) Enrolled + assigned to a cohort (batch or learning plan). */
export async function sendEnrolledEmail(p: {
  to: string;
  name: string;
  courseTitle: string;
  cohortLabel: string;
  invited: boolean;
}): Promise<void> {
  await safeSend(p.to, `You're enrolled — ${p.courseTitle}`, {
    heading: `You're enrolled in “${p.courseTitle}” 🚀`,
    intro: `Hi ${p.name},`,
    paragraphs: [
      `You're now enrolled and assigned to ${p.cohortLabel}.`,
      `You can access your learning any time from your dashboard.`,
      ...(p.invited
        ? [`We've created an account for you — check for a separate email to set your password.`]
        : []),
    ],
    button: { label: 'Go to your dashboard', url: DASHBOARD_URL },
    footerNote: `Welcome aboard!`,
  });
}
