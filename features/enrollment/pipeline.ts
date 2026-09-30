/**
 * Inquiry pipeline state machine. Pure + framework-free so it can be reused on the
 * server (transition guard) and client (which actions to show). Mirrors the Prisma
 * `InquiryStatus` enum: NEW | CONTACTED | CONFIRMED | ENROLLED | DECLINED.
 *
 * Happy path: NEW -> CONTACTED -> CONFIRMED -> ENROLLED. An inquiry may be DECLINED
 * from any open (non-terminal) stage. ENROLLED is reached by converting the inquiry
 * into an Enrollment (see server/actions), never by a plain status bump.
 */
export type InquiryStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'ENROLLED' | 'DECLINED';

/** Ordered open stages the team walks an inquiry through before enrolling. */
export const INQUIRY_STAGES: readonly InquiryStatus[] = ['NEW', 'CONTACTED', 'CONFIRMED'];

/** Terminal states — no further pipeline actions. */
export const INQUIRY_TERMINAL: readonly InquiryStatus[] = ['ENROLLED', 'DECLINED'];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  CONFIRMED: 'Confirmed',
  ENROLLED: 'Enrolled',
  DECLINED: 'Declined',
};

/** The next open stage after `status`, or null when there is no plain advance. */
export function nextStage(status: InquiryStatus): InquiryStatus | null {
  const index = INQUIRY_STAGES.indexOf(status);
  if (index === -1 || index === INQUIRY_STAGES.length - 1) return null;
  return INQUIRY_STAGES[index + 1];
}

/** Whether the inquiry is still open (can be advanced, declined, or converted). */
export function isOpen(status: InquiryStatus): boolean {
  return !INQUIRY_TERMINAL.includes(status);
}

/** Whether the inquiry may be converted into an enrollment (confirmed + open). */
export function canConvert(status: InquiryStatus): boolean {
  return status === 'CONFIRMED';
}
