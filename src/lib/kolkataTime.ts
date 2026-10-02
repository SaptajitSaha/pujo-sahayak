// ─── Kolkata calendar time (pure) ────────────────────────────────────────────
// The Puja window is a set of *Kolkata calendar days*. Deriving them from the
// device clock or from `toISOString()` is wrong twice over: `toISOString()` is
// UTC, so between 00:00–05:30 IST it reports the previous day, and a device in
// another timezone reports a different day for the entire morning/evening.
// Check-ins, streaks, the Home "Today: <tithi>" chip and the tithi timeline all
// read from here, so they agree with each other regardless of where the phone
// is set. Real instants stay UTC epoch ms — this only projects them.

import { PLAN_DAY_DATES } from '../data/demo'
import type { PlanDay } from '../data/types'

export const KOLKATA_TZ = 'Asia/Kolkata'

const isoDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: KOLKATA_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
})
const hourFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: KOLKATA_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

const toDate = (ts: number | Date) => (ts instanceof Date ? ts : new Date(ts))

/** The Kolkata calendar date an instant falls on, as 'YYYY-MM-DD'. */
export function kolkataISODate(ts: number | Date): string {
  return isoDateFmt.format(toDate(ts))
}

/** Hour 0–23 in Kolkata — used by the late-night badge, which is a puja-hours
 *  fact, not a device-clock fact. */
export function kolkataHour(ts: number | Date): number {
  const h = Number(hourFmt.format(toDate(ts)).slice(0, 2))
  return Number.isNaN(h) ? toDate(ts).getHours() : h
}

/** Whole-day ordinal (Kolkata days) — consecutive-day maths for the streak. */
export function kolkataDayIndex(ts: number | Date): number {
  const [y, m, d] = kolkataISODate(ts).split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

// ISO-date -> plan day, from the single authoritative calendar in data/demo.
const DATE_TO_PLAN_DAY: Record<string, PlanDay> = Object.entries(PLAN_DAY_DATES).reduce(
  (acc, [day, iso]) => { acc[iso] = day as PlanDay; return acc },
  {} as Record<string, PlanDay>,
)

/** The plan day (tithi) covering an instant, or null outside the 2026 window. */
export function planDayForInstant(ts: number | Date): PlanDay | null {
  return DATE_TO_PLAN_DAY[kolkataISODate(ts)] ?? null
}
