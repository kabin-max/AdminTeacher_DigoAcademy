/**
 * Pure audience-segment logic (no framework/server imports) so it's usable in
 * Server Components and unit-testable in isolation. `data.ts` fetches the raw
 * signals and delegates the merge/filter here.
 */

export type SegmentFilter = 'all' | 'leads' | 'enrolled';

export interface SegmentPerson {
  /** Dedup key: user id, or `guest:<email>` for guest inquiries. */
  key: string;
  studentId: string | null;
  name: string;
  email: string;
  phone: string | null;
  enrolled: boolean;
  progressPct: number | null;
  /** InquiryStatus if they ever inquired, else null. */
  inquiryStatus: string | null;
  wishlisted: boolean;
  /** Earliest signal date. */
  since: Date;
}

export interface SegmentCounts {
  total: number;
  enrolled: number;
  inquired: number;
  wishlisted: number;
}

export interface EnrollmentSignal {
  studentId: string;
  name: string;
  email: string;
  progressPct: number;
  since: Date;
}
export interface InquirySignal {
  studentId: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  since: Date;
}
export interface WishlistSignal {
  studentId: string;
  name: string;
  email: string;
  since: Date;
}

/**
 * Merge the three signal streams into one contact per person, deduped by user
 * id (or guest email). Guests with no email are uncontactable and dropped.
 */
export function mergeSegment(input: {
  enrollments: EnrollmentSignal[];
  inquiries: InquirySignal[];
  wishlist: WishlistSignal[];
}): { people: SegmentPerson[]; counts: SegmentCounts } {
  const map = new Map<string, SegmentPerson>();

  const touch = (
    studentId: string | null,
    name: string,
    email: string,
    phone: string | null,
    since: Date
  ): SegmentPerson | null => {
    const cleanEmail = (email ?? '').trim();
    if (!studentId && !cleanEmail) return null; // uncontactable guest — skip
    const key = studentId ?? `guest:${cleanEmail.toLowerCase()}`;
    let person = map.get(key);
    if (!person) {
      person = {
        key,
        studentId,
        name: name?.trim() || cleanEmail || 'Unknown',
        email: cleanEmail,
        phone,
        enrolled: false,
        progressPct: null,
        inquiryStatus: null,
        wishlisted: false,
        since,
      };
      map.set(key, person);
    } else {
      if (since < person.since) person.since = since;
      if (!person.phone && phone) person.phone = phone;
      if (!person.email && cleanEmail) person.email = cleanEmail;
    }
    return person;
  };

  for (const e of input.enrollments) {
    const person = touch(e.studentId, e.name, e.email, null, e.since);
    if (person) {
      person.enrolled = true;
      person.progressPct = e.progressPct;
    }
  }
  for (const i of input.inquiries) {
    const person = touch(i.studentId, i.name, i.email, i.phone, i.since);
    if (person) person.inquiryStatus = i.status;
  }
  for (const w of input.wishlist) {
    const person = touch(w.studentId, w.name, w.email, null, w.since);
    if (person) person.wishlisted = true;
  }

  const people = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  const counts: SegmentCounts = {
    total: people.length,
    enrolled: people.filter((p) => p.enrolled).length,
    inquired: people.filter((p) => p.inquiryStatus).length,
    wishlisted: people.filter((p) => p.wishlisted).length,
  };
  return { people, counts };
}

/** Narrow a segment to a filter. `leads` = interested but not yet enrolled. */
export function applySegmentFilter(people: SegmentPerson[], filter: SegmentFilter): SegmentPerson[] {
  if (filter === 'enrolled') return people.filter((p) => p.enrolled);
  if (filter === 'leads') return people.filter((p) => !p.enrolled && (p.inquiryStatus || p.wishlisted));
  return people;
}

export function isSegmentFilter(value: string | undefined): value is SegmentFilter {
  return value === 'all' || value === 'leads' || value === 'enrolled';
}
