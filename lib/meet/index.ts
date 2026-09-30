import 'server-only';

import { randomUUID } from 'node:crypto';

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { db } from '@/lib/db';
import { env, isMeetConfigured } from '@/lib/env';

export { isMeetConfigured };

/**
 * Google Meet integration seam (SOLID/DIP) — everything Calendar/Meet-related
 * goes through this module so features never touch the Google SDK directly.
 *
 * One shared Google account is connected once (admin, via OAuth) and used to
 * create every LiveClass's Calendar event with an auto-generated Meet link.
 * Tokens are stored on the singleton `GoogleMeetConnection` row, mirroring how
 * Better Auth stores OAuth tokens on `Account` — plain columns, no separate
 * encryption layer, consistent with the rest of this codebase.
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
];
const CONNECTION_ID = 'singleton';

function redirectUri(): string {
  return `${env.BETTER_AUTH_URL}/api/google-meet/callback`;
}

function requireConfig() {
  if (!isMeetConfigured) {
    throw new Error('Google Meet is not configured (set GOOGLE_MEET_CLIENT_ID/SECRET).');
  }
  return { clientId: env.GOOGLE_MEET_CLIENT_ID!, clientSecret: env.GOOGLE_MEET_CLIENT_SECRET! };
}

function newOAuthClient(): OAuth2Client {
  const { clientId, clientSecret } = requireConfig();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri());
}

/** Build the Google consent-screen URL the admin is redirected to. */
export function getMeetAuthUrl(state: string): string {
  const client = newOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force a refresh_token even on a reconnect
    scope: SCOPES,
    state,
  });
}

/** Exchange the OAuth callback `code` for tokens and persist the connection. */
export async function exchangeMeetCode(code: string): Promise<{ accountEmail: string }> {
  const { clientId } = requireConfig();
  const client = newOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Disconnect any prior grant for this app in your Google Account, then try connecting again.'
    );
  }
  client.setCredentials(tokens);

  let accountEmail: string | undefined;

  if (tokens.id_token) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      accountEmail = ticket.getPayload()?.email;
    } catch {
      // Fall through to userinfo.get()
    }
  }

  if (!accountEmail) {
    const oauth2 = google.oauth2({ auth: client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();
    accountEmail = data.email ?? undefined;
  }

  if (!accountEmail) throw new Error('Could not read the connected Google account email.');

  await db.googleMeetConnection.upsert({
    where: { id: CONNECTION_ID },
    create: {
      id: CONNECTION_ID,
      accountEmail,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 60 * 60 * 1000),
    },
    update: {
      accountEmail,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 60 * 60 * 1000),
    },
  });

  return { accountEmail };
}

/** Current connection status for the admin settings page. */
export async function getMeetConnection(): Promise<{ accountEmail: string; connectedAt: Date } | null> {
  const row = await db.googleMeetConnection.findUnique({ where: { id: CONNECTION_ID } });
  return row ? { accountEmail: row.accountEmail, connectedAt: row.connectedAt } : null;
}

export async function disconnectMeet(): Promise<void> {
  const row = await db.googleMeetConnection.findUnique({ where: { id: CONNECTION_ID } });
  if (!row) return;
  try {
    const client = newOAuthClient();
    await client.revokeToken(row.refreshToken);
  } catch (error) {
    // Best-effort — still drop the local row even if Google's revoke call fails
    // (e.g. the grant was already revoked on Google's side).
    console.error('google-meet: revoke failed', error);
  }
  await db.googleMeetConnection.delete({ where: { id: CONNECTION_ID } });
}

/** An authorized client for the connected account, refreshing + persisting a
 * rotated access token automatically. Throws if nothing is connected. */
async function getAuthorizedClient(): Promise<OAuth2Client> {
  const row = await db.googleMeetConnection.findUnique({ where: { id: CONNECTION_ID } });
  if (!row) {
    throw new Error('Google Calendar is not connected. Connect it in Settings first.');
  }

  const client = newOAuthClient();
  client.setCredentials({
    access_token: row.accessToken,
    refresh_token: row.refreshToken,
    expiry_date: row.expiresAt.getTime(),
  });
  client.on('tokens', (tokens) => {
    if (!tokens.access_token) return;
    void db.googleMeetConnection
      .update({
        where: { id: CONNECTION_ID },
        data: {
          accessToken: tokens.access_token,
          expiresAt: new Date(tokens.expiry_date ?? Date.now() + 60 * 60 * 1000),
        },
      })
      .catch((error) => console.error('google-meet: token refresh persist failed', error));
  });
  return client;
}

export interface MeetEventInput {
  title: string;
  description?: string | null;
  startTime: Date;
  durationMin: number;
  attendeeEmails?: string[];
  instructorEmail?: string;
}

export interface MeetEventResult {
  meetLink: string;
  googleEventId: string;
}

function buildAttendees(attendeeEmails?: string[], instructorEmail?: string) {
  const all = [...(attendeeEmails ?? []), instructorEmail].filter((e): e is string => Boolean(e && e.trim()));
  const unique = Array.from(new Set(all.map((e) => e.trim().toLowerCase())));
  if (unique.length === 0) return undefined;
  return unique.map((email) => ({ email, responseStatus: 'accepted' }));
}

/** Create a Calendar event with an auto-generated Meet link. */
export async function createMeetEvent(input: MeetEventInput): Promise<MeetEventResult> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const endTime = new Date(input.startTime.getTime() + input.durationMin * 60_000);
  const attendees = buildAttendees(input.attendeeEmails, input.instructorEmail);

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
      attendees,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const meetLink = data.hangoutLink;
  if (!meetLink || !data.id) {
    throw new Error('Google did not return a Meet link for this event.');
  }
  return { meetLink, googleEventId: data.id };
}

/** UTC basic format Google's RRULE UNTIL expects, e.g. "20260921T000000Z". */
function toRRuleUntil(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export interface RecurringMeetEventInput extends MeetEventInput {
  /** Bound for the weekly recurrence; omit for an indefinite weekly series. */
  untilDate?: Date | null;
}

/**
 * Create a weekly recurring Calendar event (day/time taken from `startTime`,
 * bounded by `untilDate` if given). One Meet link is generated for the whole
 * series and stays the same for every occurrence — used for a batch's regular
 * class slot, as opposed to `createMeetEvent`'s one-off sessions.
 */
export async function createRecurringMeetEvent(
  input: RecurringMeetEventInput
): Promise<MeetEventResult> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const endTime = new Date(input.startTime.getTime() + input.durationMin * 60_000);
  const recurrence = `RRULE:FREQ=WEEKLY${input.untilDate ? `;UNTIL=${toRRuleUntil(input.untilDate)}` : ''}`;
  const attendees = buildAttendees(input.attendeeEmails, input.instructorEmail);

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
      recurrence: [recurrence],
      attendees,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const meetLink = data.hangoutLink;
  if (!meetLink || !data.id) {
    throw new Error('Google did not return a Meet link for this event.');
  }
  return { meetLink, googleEventId: data.id };
}

/** Update a recurring series' time/title/description/end bound (Meet link unchanged). */
export async function updateRecurringMeetEvent(
  googleEventId: string,
  input: RecurringMeetEventInput
): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const endTime = new Date(input.startTime.getTime() + input.durationMin * 60_000);
  const recurrence = `RRULE:FREQ=WEEKLY${input.untilDate ? `;UNTIL=${toRRuleUntil(input.untilDate)}` : ''}`;
  const attendees = buildAttendees(input.attendeeEmails, input.instructorEmail);

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    sendUpdates: 'none',
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
      recurrence: [recurrence],
      ...(attendees ? { attendees, guestsCanInviteOthers: false, guestsCanSeeOtherGuests: true } : {}),
    },
  });
}

/** Update an existing event's time/title/description (Meet link is unchanged). */
export async function updateMeetEvent(
  googleEventId: string,
  input: MeetEventInput
): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const endTime = new Date(input.startTime.getTime() + input.durationMin * 60_000);
  const attendees = buildAttendees(input.attendeeEmails, input.instructorEmail);

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    sendUpdates: 'none',
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
      ...(attendees ? { attendees, guestsCanInviteOthers: false, guestsCanSeeOtherGuests: true } : {}),
    },
  });
}

/** Update only the attendees list for an existing Calendar event without altering event dates/times. */
export async function updateMeetEventAttendees(
  googleEventId: string,
  attendeeEmails: string[]
): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const uniqueEmails = Array.from(new Set(attendeeEmails.filter((e) => Boolean(e && e.trim())).map((e) => e.trim().toLowerCase())));

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    sendUpdates: 'none',
    requestBody: {
      attendees: uniqueEmails.map((email) => ({ email, responseStatus: 'accepted' })),
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
    },
  });
}

/**
 * Automatically syncs a batch's instructor and all enrolled students' emails into the
 * batch's Google Meet calendar event attendees list. This allows the instructor to join
 * without admin admission, and enrolled students to join automatically without knocking.
 */
export async function syncBatchMeetAttendees(batchId: string): Promise<void> {
  if (!isMeetConfigured) return;
  try {
    const batch = await db.batch.findUnique({
      where: { id: batchId },
      select: {
        googleEventId: true,
        instructor: { select: { email: true } },
        enrollments: { select: { student: { select: { email: true } } } },
      },
    });

    if (!batch || !batch.googleEventId) return;

    const emails: string[] = [];
    if (batch.instructor?.email) emails.push(batch.instructor.email);
    for (const e of batch.enrollments) {
      if (e.student?.email) emails.push(e.student.email);
    }

    await updateMeetEventAttendees(batch.googleEventId, emails);
  } catch (error) {
    console.error('syncBatchMeetAttendees failed', error);
  }
}

/** Resync attendees for all batches that have an active Google Meet event. */
export async function syncAllBatchesMeetAttendees(): Promise<number> {
  if (!isMeetConfigured) return 0;
  const batches = await db.batch.findMany({
    where: { googleEventId: { not: null } },
    select: { id: true },
  });
  for (const b of batches) {
    await syncBatchMeetAttendees(b.id);
  }
  return batches.length;
}

/** Delete the Calendar event. Treats "already gone" as success. */
export async function deleteMeetEvent(googleEventId: string): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 404 || code === 410) return;
    throw error;
  }
}
