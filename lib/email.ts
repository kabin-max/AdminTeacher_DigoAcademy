import 'server-only';

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

import { env } from '@/lib/env';

export interface SendEmailInput {
  to: string;
  subject: string;
  /** Plain-text body (fallback for clients that don't render HTML). */
  text: string;
  /** Optional HTML body — preferred by clients when present. */
  html?: string;
}

/** Whether a real email provider (AWS SES) is configured. */
export const isEmailConfigured = Boolean(env.SES_REGION);

let sesClient: SESv2Client | null = null;
function getSes(): SESv2Client {
  if (!sesClient) {
    sesClient = new SESv2Client({
      region: env.SES_REGION,
      // Explicit keys when provided; otherwise the default AWS provider chain
      // (IAM role on the host, or standard AWS_* env vars).
      credentials:
        env.SES_ACCESS_KEY_ID && env.SES_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.SES_ACCESS_KEY_ID,
              secretAccessKey: env.SES_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return sesClient;
}

/**
 * Transactional email sender.
 *
 * - If SES_REGION is set, sends via AWS SES (production path).
 * - Otherwise, in development it logs the message (including any verification /
 *   reset link) to the server console.
 * - In production with no provider it throws, so misconfiguration fails loudly
 *   rather than silently dropping mail.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<void> {
  if (isEmailConfigured) {
    await getSes().send(
      new SendEmailCommand({
        FromEmailAddress: env.EMAIL_FROM,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}),
              Text: { Data: text, Charset: 'UTF-8' },
            },
          },
        },
      })
    );
    return;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'No email provider configured. Set SES_REGION (and EMAIL_FROM) before production.'
    );
  }

  console.info(
    ['', '📧  [dev email]', `  to:      ${to}`, `  subject: ${subject}`, `  body:    ${text}`, ''].join(
      '\n'
    )
  );
}
