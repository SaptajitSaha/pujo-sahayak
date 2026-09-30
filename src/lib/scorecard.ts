import { PLAN_DAY_DATES } from '../data/demo'
import type { PlanDay, Walk } from '../data/types'
import { haversineKm } from './geo'

/**
 * Pure, offline logic behind the Pandal-Hopping Scorecard.
 *
 * Everything here is a deterministic function of a user's own check-in log —
 * there is no server and nothing is invented. A check-in is only ever created
 * after the device's real GPS has confirmed presence inside a pandal's
 * geofence (see PandalDetail); this module just counts what actually happened.
 */

/** One GPS-verified visit to a pandal. */
export interface Checkin {
  placeId: string
  /** Plan day the visit fell on (local), or null if outside the 2026 window. */
  tithi: PlanDay | null
  /** Epoch ms of the check-in. */
  ts: number
  /** Where the device was when it checked in — kept for audit, not displayed. */
  lat: number
  lng: number
  /** GPS accuracy radius reported by the device, in metres. */
  accuracyM: number
}

/** Default geofence: you must be within 150 m of the pandal to check in. */
export const CHECKIN_RADIUS_M = 150

export interface LngLat { lat: number; lng: number }

/**
 * Is `user` close enough to `place` to legitimately check in?
 *
 * The gate widens to the device's own accuracy radius when that is larger than
 * CHECKIN_RADIUS_M — a phone that admits ±500 m shouldn't punish an honest
 * user standing right at the pandal. It never shrinks below the base radius.
 */
export function withinGeofence(user: LngLat, place: LngLat, accuracyM = 0, radiusM = CHECKIN_RADIUS_M): boolean {
  const distM = haversineKm(user.lat, user.lng, place.lat, place.lng) * 1000
  return distM <= Math.max(radiusM, accuracyM)
}

// Build an ISO-date -> PlanDay lookup once from the authoritative demo calendar.
const DATE_TO_PLAN_DAY: Record<string, PlanDay> = Object.entries(PLAN_DAY_DATES).reduce(
  (acc, [day, iso]) => { acc[iso] = day as PlanDay; return acc },
  {} as Record<string, PlanDay>,
)

function isoLocalDate(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Which plan day (tithi) a check-in fell on, in the user's local date. */
export function tithiForTs(ts: number): PlanDay | null {
  return DATE_TO_PLAN_DAY[isoLocalDate(ts)] ?? null
}

/** Whole-day ordinal from a local calendar date (DST-safe, Kolkata has none). */
function dayIndex(ts: number): number {
  const d = new Date(ts)
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000
}

/** Longest run of consecutive local days that each have at least one check-in. */
export function longestStreak(checkins: Checkin[]): number {
  const days = [...new Set(checkins.map((c) => dayIndex(c.ts)))].sort((a, b) => a - b)
  let best = 0
  let run = 0
  let prev = Number.NaN
  for (const day of days) {
    run = !Number.isNaN(prev) && day === prev + 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = day
  }
  return best
}

export interface ScorecardSummary {
  pandals: number
  tithis: number
  streak: number
}

/** Headline counts derived straight from the check-in log. */
export function scorecardSummary(checkins: Checkin[]): ScorecardSummary {
  const pandals = new Set(checkins.map((c) => c.placeId)).size
  const tithis = new Set(checkins.map((c) => c.tithi).filter((x): x is PlanDay => !!x)).size
  return { pandals, tithis, streak: longestStreak(checkins) }
}

export interface BadgeDef {
  id: string
  label: string
  hint: string
  test: (checkins: Checkin[], walks: Walk[]) => boolean
}

const uniquePandals = (cs: Checkin[]) => new Set(cs.map((c) => c.placeId)).size
const uniqueTithis = (cs: Checkin[]) => new Set(cs.map((c) => c.tithi).filter(Boolean)).size

/**
 * The badge ladder. Order is what the UI renders, so keep it stable.
 */
export const BADGES: BadgeDef[] = [
  { id: 'first-darshan', label: 'First Darshan', hint: 'Check in at any pandal', test: (cs) => uniquePandals(cs) >= 1 },
  { id: 'parjatak', label: 'Parjatak', hint: '5 different pandals', test: (cs) => uniquePandals(cs) >= 5 },
  { id: 'maha-parjatak', label: 'Maha Parjatak', hint: '10 different pandals', test: (cs) => uniquePandals(cs) >= 10 },
  { id: 'tithi-trotter', label: 'Tithi Trotter', hint: 'Check in on 3 different tithis', test: (cs) => uniqueTithis(cs) >= 3 },
  {
    id: 'midnight-darshan',
    label: 'Midnight Darshan',
    hint: 'A check-in between 10 PM and 2 AM',
    test: (cs) => cs.some((c) => { const h = new Date(c.ts).getHours(); return h >= 22 || h < 2 }),
  },
  {
    id: 'walk-finisher',
    label: 'Walk Finisher',
    hint: 'Complete every stop on one curated walk',
    test: (cs, walks) => {
      const done = new Set(cs.map((c) => c.placeId))
      return walks.some((w) => w.stops.length > 0 && w.stops.every((s) => done.has(s.placeId)))
    },
  },
]

export interface BadgeState { def: BadgeDef; earned: boolean }

/** Evaluate every badge against the log; the UI renders this array directly. */
export function evaluateBadges(checkins: Checkin[], walks: Walk[]): BadgeState[] {
  return BADGES.map((def) => ({ def, earned: def.test(checkins, walks) }))
}
