import type { PlanDay, Walk } from '../data/types'
import { haversineKm } from './geo'
import { kolkataDayIndex, kolkataHour, planDayForInstant } from './kolkataTime'

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
 * Ceiling on how much a device's own error may widen the gate. Without it a
 * poor fix (browser Wi-Fi/cell positioning routinely reports ±500–2000 m)
 * would certify someone 1.5 km away as "GPS-verified on-site" — a claim the UI
 * makes out loud, so the gate must be no looser than the words.
 */
export const MAX_ACCURACY_M = 300

/**
 * Is `user` close enough to `place` to legitimately check in?
 *
 * The gate widens to the device's own accuracy radius when that is larger than
 * CHECKIN_RADIUS_M — a phone that admits ±250 m shouldn't punish an honest user
 * standing right at the pandal — but it never widens past MAX_ACCURACY_M, and a
 * fix worse than that is refused outright (see evaluateCheckIn for the reason).
 */
export function withinGeofence(user: LngLat, place: LngLat, accuracyM = 0, radiusM = CHECKIN_RADIUS_M): boolean {
  if (accuracyM > MAX_ACCURACY_M) return false
  const distM = haversineKm(user.lat, user.lng, place.lat, place.lng) * 1000
  return distM <= Math.min(Math.max(radiusM, accuracyM), MAX_ACCURACY_M)
}

export type CheckInVerdict = 'ok' | 'poor-signal' | 'far'

/**
 * Why a check-in was or wasn't allowed, so the UI can offer the right next step
 * instead of one generic failure: an unusable fix deserves a retry in the open,
 * a genuinely distant one deserves "move closer".
 */
export function evaluateCheckIn(user: LngLat, place: LngLat, accuracyM: number): CheckInVerdict {
  if (accuracyM > MAX_ACCURACY_M) return 'poor-signal'
  return withinGeofence(user, place, accuracyM) ? 'ok' : 'far'
}

// Date maths lives in ./kolkataTime: the puja window is a set of Kolkata
// calendar days, so a device clock or a UTC ISO string must not decide which
// tithi a check-in belongs to.

/** Which plan day (tithi) a check-in fell on, on the Kolkata calendar. */
export function tithiForTs(ts: number): PlanDay | null {
  return planDayForInstant(ts)
}

/** Whole-day ordinal from a Kolkata calendar date (DST-safe; Kolkata has none). */
function dayIndex(ts: number): number {
  return kolkataDayIndex(ts)
}

/** Longest run of consecutive Kolkata days that each have at least one check-in. */
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
    hint: 'A check-in between 10 PM and 2 AM (Kolkata time)',
    test: (cs) => cs.some((c) => { const h = kolkataHour(c.ts); return h >= 22 || h < 2 }),
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
