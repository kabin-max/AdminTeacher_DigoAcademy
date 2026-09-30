/** How long a weekly occurrence counts as "live" after its start time. */
const SESSION_WINDOW_MS = 90 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface ScheduleResult {
  nextOccurrence: string | null;
  isLive: boolean;
}

/**
 * Next weekly occurrence of `startDate`'s day/time at-or-after `now`, bounded
 * by `endDate`. `isLive` is true while inside the current occurrence's window.
 * Framework-free (no DB) so it's usable from any feature that needs to display
 * a batch's recurring class schedule.
 */
export function computeSchedule(
  startDate: Date,
  endDate: Date | null,
  now: number = Date.now()
): ScheduleResult {
  let occurrence = startDate.getTime();
  while (occurrence + SESSION_WINDOW_MS < now) occurrence += WEEK_MS;

  if (endDate && occurrence > endDate.getTime()) return { nextOccurrence: null, isLive: false };
  const isLive = now >= occurrence && now <= occurrence + SESSION_WINDOW_MS;
  return { nextOccurrence: new Date(occurrence).toISOString(), isLive };
}
