/**
 * Branded, email-client-safe HTML template (table layout + inline styles, no
 * remote assets) with a matching plain-text fallback. Pure — no server imports —
 * so it's usable anywhere and unit-testable.
 */

export interface EmailButton {
  label: string;
  url: string;
}
export interface EmailContent {
  /** Preheader / H1 line. */
  heading: string;
  intro?: string;
  paragraphs?: string[];
  button?: EmailButton;
  /** Small muted note under the body (e.g. "link expires soon"). */
  footerNote?: string;
}

// Brand palette (from the logo): azure blue + a deep blue for good white-text contrast.
const BRAND = { azure: '#2E9BD6', deep: '#1477B3', ink: '#0f2b46' };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buttonHtml(button: EmailButton): string {
  return `
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
          <tr>
            <td style="border-radius:8px;background:${BRAND.deep};">
              <a href="${escapeHtml(button.url)}" target="_blank" rel="noopener"
                 style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                ${escapeHtml(button.label)}
              </a>
            </td>
          </tr>
        </table>`;
}

export function renderEmail(content: EmailContent): { html: string; text: string } {
  const year = new Date().getFullYear();
  const paragraphs = content.paragraphs ?? [];

  const bodyParagraphs = [content.intro, ...paragraphs]
    .filter((p): p is string => Boolean(p))
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(
          p
        )}</p>`
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(content.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0"
                 style="width:560px;max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e9f0;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #eef2f7;">
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:${BRAND.ink};letter-spacing:-0.01em;">Digo <span style="color:${BRAND.azure};">Academy</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.3;font-weight:700;color:${BRAND.ink};">${escapeHtml(
                  content.heading
                )}</h1>
                ${bodyParagraphs}
                ${content.button ? buttonHtml(content.button) : ''}
                ${
                  content.footerNote
                    ? `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#94a3b8;">${escapeHtml(
                        content.footerNote
                      )}</p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #eef2f7;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#94a3b8;">
                  © ${year} Digo Academy. You're receiving this because you interacted with Digo Academy.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [content.heading, '', ...[content.intro, ...paragraphs].filter(Boolean)];
  if (content.button) textParts.push('', `${content.button.label}: ${content.button.url}`);
  if (content.footerNote) textParts.push('', content.footerNote);
  textParts.push('', `— Digo Academy`);
  const text = textParts.join('\n');

  return { html, text };
}
