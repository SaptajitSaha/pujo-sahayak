// Best Time To Visit — a modelled hour-by-hour crowd curve for a pandal.
//
// Honesty rule (doc §58, same convention as Pandal Pulse): this is a
// MODELLED estimate from a fixed puja-evening shape scaled by the place's
// seeded crowd level — never a live sensor feed. The calling component
// captions it as such. When a place has no crowd level we still show the
// generic puja-evening pattern (mornings quieter, ~9pm peak) but the caller
// marks it "typical pattern" rather than place-specific.

import type { CrowdLevel, Place } from '../data/types'
import { formatClock, parseClock } from './pulse'

export type CrowdRank = 'calm' | 'moderate' | 'busy'

export interface TimeWindow {
  /** 0–23 start hour. */
  startHour: number
  /** Display label, e.g. "10:00 AM–12:00 PM" (wraps past midnight). */
  label: string
  rank: CrowdRank
  /** Modelled average busyness for the block, 0–1. */
  intensity: number
}

export interface BestTimeReadout {
  /** Calmest 2-hour blocks to aim for (up to two, non-overlapping). */
  best: TimeWindow[]
  /** Busiest block to steer around, present only when it is genuinely busy. */
  avoid: TimeWindow | null
  /** False when the place carries no seeded crowd level. */
  hasCrowdData: boolean
}

// Conventional gate-open hour for a public pandal. Used only to bound the
// operating window; not a claim about a specific committee's schedule.
const GATE_OPEN_HOUR = 10

// Relative busyness 0–1 for each hour of a typical Durga Puja day at a
// well-trafficked pandal: quiet mornings, an afternoon plateau, an evening
// build peaking around 9–10pm, tapering past midnight. Fixed profile.
const HOUR_SHAPE: number[] = [
  0.70, 0.55, 0.35, 0.15, 0.08, 0.05, // 00–05 overnight taper
  0.06, 0.08, 0.12, 0.18, 0.28, 0.36, // 06–11 morning build
  0.44, 0.48, 0.50, 0.52, 0.58, 0.66, // 12–17 afternoon plateau
  0.76, 0.86, 0.94, 1.00, 0.98, 0.86, // 18–23 evening peak (~9pm)
]

// Seeded crowd level scales the whole curve — a "high" pandal runs busier
// at every hour than a "low" one, but the shape of the day holds.
const CROWD_MULT: Record<CrowdLevel, number> = { low: 0.55, moderate: 0.75, high: 1.0 }

function rankOf(intensity: number): CrowdRank {
  if (intensity < 0.35) return 'calm'
  if (intensity < 0.7) return 'moderate'
  return 'busy'
}

/** Hour-by-hour modelled busyness for a place; crowd level scales the shape. */
export function hourIntensity(crowd: CrowdLevel | undefined, hour: number): number {
  const shape = HOUR_SHAPE[((hour % 24) + 24) % 24] ?? 0
  return crowd ? shape * CROWD_MULT[crowd] : shape
}

/**
 * Hours the pandal is plausibly open, in visiting order: from the gate-open
 * hour up to (not including) the posted closing hour. A past-midnight close
 * (e.g. 2:00 AM) wraps through 00:00. No closing time → a safe early-evening
 * window rather than a fabricated all-night schedule.
 */
export function operatingHours(openTill?: string): number[] {
  let closeHour = GATE_OPEN_HOUR + 12
  if (openTill) {
    const mins = parseClock(openTill)
    if (mins != null) closeHour = Math.floor(mins / 60) % 24
  }
  const out: number[] = []
  let h = GATE_OPEN_HOUR
  for (let guard = 0; guard < 24; guard++) {
    if (h === closeHour) break
    out.push(h)
    h = (h + 1) % 24
  }
  return out
}

function windowLabel(startHour: number): string {
  return `${formatClock(startHour * 60)}–${formatClock(startHour * 60 + 120)}`
}

/** Assemble the readout: calmest and busiest 2-hour blocks over the day. */
export function bestWindows(place: Pick<Place, 'crowd' | 'openTill'>): BestTimeReadout {
  const hours = operatingHours(place.openTill)
  const hasCrowdData = !!place.crowd

  // Consecutive-hour blocks of two, each scored by average modelled busyness.
  const blocks: TimeWindow[] = []
  for (let i = 0; i + 1 < hours.length; i++) {
    const [a, b] = [hours[i], hours[i + 1]]
    // Only a true adjacent pair (b == a+1 mod 24) forms a contiguous block.
    if ((a + 1) % 24 !== b) continue
    const intensity = (hourIntensity(place.crowd, a) + hourIntensity(place.crowd, b)) / 2
    blocks.push({ startHour: a, label: windowLabel(a), rank: rankOf(intensity), intensity })
  }

  const byCalm = [...blocks].sort((x, y) => x.intensity - y.intensity)
  const best: TimeWindow[] = []
  for (const blk of byCalm) {
    if (best.length >= 2) break
    // Skip a block that shares a start or overlaps an already-picked one.
    const overlaps = best.some((p) => Math.abs(p.startHour - blk.startHour) < 2)
    if (!overlaps && blk.rank !== 'busy') best.push(blk)
  }

  const busiest = [...blocks].sort((x, y) => y.intensity - x.intensity)[0]
  const avoid = busiest && busiest.rank === 'busy' ? busiest : null

  return { best, avoid, hasCrowdData }
}
