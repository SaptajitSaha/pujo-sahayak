import { haversineKm } from './geo'
import { longestStreak, type Checkin } from './scorecard'

/**
 * Personal Puja Statistics — every number here is a deterministic function of
 * the user's own GPS-verified check-in log (plus their saved/visited counts).
 * No backend analytics, no community benchmarks, nothing fabricated: if a fact
 * can't be derived from real local activity it is left null / zero, not guessed.
 */
export interface PujaStatsInput {
  checkins: Checkin[]
  saved: number
  visited: number
}

export interface PujaStats {
  totalCheckins: number
  distinctPandals: number
  distinctTithis: number
  longestStreak: number
  /** Approximate straight-line km between consecutive (chronological) fixes. */
  totalKm: number
  /** Distinct pandals divided by the number of days that had activity. */
  pandalsPerDay: number
  /** Hour of day with the most check-ins (0-23), or null with no activity. */
  busiestHour: number | null
  /** Hour of day with the fewest check-ins among *visited* hours, or null. */
  quietestHour: number | null
  /** Visited / saved ratio (0..1), or null when nothing is saved. */
  savedVsVisited: number | null
}

export function computePujaStats({ checkins, saved, visited }: PujaStatsInput): PujaStats {
  const distinctPandals = new Set(checkins.map((c) => c.placeId)).size
  const distinctTithis = new Set(checkins.map((c) => c.tithi).filter(Boolean)).size

  // Travel: sum haversine between successive fixes in time order — a straight-
  // line proxy, honest because we label it as such in the UI, not a step count.
  const byTs = [...checkins].sort((a, b) => a.ts - b.ts)
  let totalKm = 0
  for (let i = 1; i < byTs.length; i++) {
    totalKm += haversineKm(byTs[i - 1].lat, byTs[i - 1].lng, byTs[i].lat, byTs[i].lng)
  }

  const activeDays = new Set(byTs.map((c) => new Date(c.ts).toDateString())).size
  const pandalsPerDay = activeDays ? distinctPandals / activeDays : 0

  // Hour histogram over hours that actually had a visit; scanning 0..23 keeps
  // ties deterministic (the earlier hour wins).
  const counts = new Array<number>(24).fill(0)
  for (const c of checkins) counts[new Date(c.ts).getHours()]++
  let busiestHour: number | null = null
  let quietestHour: number | null = null
  let max = -1
  let min = Infinity
  for (let h = 0; h < 24; h++) {
    const n = counts[h]
    if (n === 0) continue
    if (n > max) { max = n; busiestHour = h }
    if (n < min) { min = n; quietestHour = h }
  }

  return {
    totalCheckins: checkins.length,
    distinctPandals,
    distinctTithis,
    longestStreak: longestStreak(checkins),
    totalKm,
    pandalsPerDay,
    busiestHour,
    quietestHour,
    savedVsVisited: saved > 0 ? visited / saved : null,
  }
}
