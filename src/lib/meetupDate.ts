// ─── Meetup date parsing (pure) ──────────────────────────────────────────────
// Seeded meetups carry a human label ('Sat, 12 Oct') and a time ('7:00 PM'),
// which is display text, not a date — so nothing could tell an expired meetup
// from an upcoming one and the list happily showed past dates as "upcoming".
// These helpers turn that label into a real instant for comparison, and fail
// *open* (null → keep the card) because hiding a meetup on a parse failure
// would silently delete content the user might still need.

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

const DATE_RE = /(\d{1,2})\s*[-\s]?\s*([A-Za-z]{3,9})/
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i
const TIME24_RE = /^(\d{1,2}):(\d{2})$/

/**
 * Local start time of a meetup, or null when the label cannot be read.
 * Accepts the seeded display form ('Sat, 12 Oct') and the ISO form a user's
 * date input produces ('2026-10-12'). For the display form the month
 * abbreviation decides the year: the puja calendar is October, so a label whose
 * month already passed rolls to next year rather than going stale forever.
 */
export function parseMeetupStart(date: string, time: string, now: Date = new Date()): Date | null {
  let year = now.getFullYear()
  let month = -1
  let day = 0

  const iso = ISO_RE.exec(date.trim())
  if (iso) {
    year = Number(iso[1]); month = Number(iso[2]) - 1; day = Number(iso[3])
  } else {
    const dm = DATE_RE.exec(date)
    if (!dm) return null
    day = Number(dm[1])
    month = MONTHS[dm[2].slice(0, 3).toLowerCase()]
    if (!Number.isFinite(day) || month === undefined) return null
    if (month < now.getMonth()) year += 1
  }
  if (month < 0 || month > 11 || day < 1 || day > 31) return null

  let hour = 12
  let minute = 0
  const t = time.trim()
  const tm = TIME_RE.exec(t)
  const t24 = TIME24_RE.exec(t)
  if (tm) {
    hour = Number(tm[1]) % 12
    minute = Number(tm[2])
    if (/pm/i.test(tm[3])) hour += 12
  } else if (t24) {
    hour = Number(t24[1])
    minute = Number(t24[2])
  }
  if (hour > 23 || minute > 59) return null

  const at = new Date(year, month, day, hour, minute)
  // Reject impossible days (e.g. 31 Feb) which Date silently rolls over.
  if (at.getMonth() !== month || at.getDate() !== day) return null
  return at
}

/** True when the meetup has not started yet — or when its date cannot be read. */
export function isUpcoming(date: string, time: string, now: Date = new Date()): boolean {
  const start = parseMeetupStart(date, time, now)
  return start === null || start.getTime() >= now.getTime()
}
