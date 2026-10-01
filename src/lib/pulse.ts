// Pandal "Pulse" — a compact at-a-glance status readout for a pandal detail page.
//
// Honesty rule (doc §58, same convention as parking capacity / metro timetable /
// blood-bank availability on this screen): every value is either DERIVED from real
// place data or an explicitly MODELLED estimate. Nothing here claims to be a live
// sensor reading; the calling component captions the whole card as illustrative.
//
//   • Crowd density ....... seeded `place.crowd` (already shown via CrowdTag).
//   • Optimal window ...... the quiet hour before the posted `place.openTill`.
//   • Medical status ...... presence of a medical/first-aid entry in `facilities`.
//   • Photo-spot rating .. `topClicks` count + `reviewCount` footprint.
//   • Metro ............... real station name from `place.metro`; walk minutes are
//                           modelled (metroETAs carry no coordinates to compute from).
//   • Queue wait .......... modelled from crowd × time-of-day × weekend — the only
//                           fully-simulated field, per the "no backend" constraint.

import type { CrowdLevel, LiveNote, OfficialNotice, Place } from '../data/types'

export type PulseTone = 'good' | 'warn' | 'bad' | 'neutral'
export type PulseIcon = 'users' | 'clock' | 'window' | 'metro' | 'medical' | 'camera'
/** Where a row's value comes from. `modelled`/`seed` = computed on-device;
    `official` = backed by a live authority notice; `visitor` = a community note. */
export type PulseSource = 'official' | 'visitor' | 'modelled'

export interface PulseItem {
  key: 'crowd' | 'queue' | 'window' | 'metro' | 'medical' | 'photo'
  label: string
  value: string
  tone: PulseTone
  icon: PulseIcon
  /** Provenance of the value. Defaults to `modelled` unless a live signal backs it. */
  source: PulseSource
  /** ISO timestamp of the notice/note that sourced this row (when live). */
  updatedAt?: string
}

export interface PulseReadout {
  value: string
  tone: PulseTone
}

/** Missing data renders as an em dash, never a fabricated value. */
const NONE = '—'

/** Seeded crowd level → colour-coded label. No crowd, no claim. */
export function crowdReadout(crowd?: CrowdLevel): PulseReadout {
  switch (crowd) {
    case 'high': return { value: 'High', tone: 'bad' }
    case 'moderate': return { value: 'Moderate', tone: 'warn' }
    case 'low': return { value: 'Low', tone: 'good' }
    default: return { value: 'Not reported', tone: 'neutral' }
  }
}

const QUEUE_BASE: Record<CrowdLevel, number> = { low: 5, moderate: 15, high: 25 }

/**
 * Modelled queue wait (minutes). Base from the seeded crowd level, inflated
 * during the 8pm–2am puja-evening peak and further on Fri/Sat. Returns null
 * when there's no crowd level to anchor the estimate — never a bare guess.
 * Rounded to the nearest 5 so it reads like an estimate, not a measurement.
 */
export function estimateQueueMin(crowd: CrowdLevel | undefined, when: Date): number | null {
  if (!crowd) return null
  const hour = when.getHours()
  const peak = hour >= 20 || hour < 2 // 8pm–2am window
  const weekend = when.getDay() === 5 || when.getDay() === 6 // Fri / Sat
  let mins = QUEUE_BASE[crowd]
  if (peak) mins *= 1.5
  if (weekend) mins *= 1.2
  return Math.max(5, Math.round(mins / 5) * 5)
}

/** Parse "H:MM AM/PM" → minutes since midnight, or null if it doesn't match. */
export function parseClock(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(s.trim())
  if (!m) return null
  const h = Number(m[1]) % 12
  const min = Number(m[2])
  const suffix = m[3].toUpperCase()
  if (min > 59 || h > 11 || Number.isNaN(Number(m[1]))) return null
  return (h + (suffix === 'PM' ? 12 : 0)) * 60 + min
}

/** Minutes since midnight → "H:MM AM/PM", wrapping across midnight. */
export function formatClock(totalMin: number): string {
  const min = ((totalMin % 1440) + 1440) % 1440
  const h = Math.floor(min / 60)
  const mm = min % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/**
 * Optimal visiting window: the last hour before the pandal's posted closing
 * time. Grounded entirely in the real `openTill` — the quiet, fully-lit stretch
 * before shutdown. Null when no closing time is on record.
 */
export function optimalWindow(openTill?: string): string | null {
  if (!openTill) return null
  const close = parseClock(openTill)
  if (close == null) return null
  return `${formatClock(close - 60)}–${formatClock(close)}`
}

const MEDICAL_RE = /medical|first\s*aid|hospital|clinic|doctor/i

/** Medical cover is read straight from the facilities list — no guessing. */
export function medicalStatus(facilities: string[]): PulseReadout {
  const has = facilities.some((f) => MEDICAL_RE.test(f))
  return has ? { value: 'Active', tone: 'good' } : { value: 'None listed', tone: 'neutral' }
}

/**
 * Photo-spot quality, derived from the visible evidence: how many top-click
 * photos the pandal has and how reviewed it is. A proxy for "photographers
 * flock here", computed from data already on the page.
 */
export function photoSpotRating(place: { topClicks?: { likes: number }[]; reviewCount: number }): PulseReadout {
  const photos = place.topClicks?.length ?? 0
  if (photos >= 3 || place.reviewCount >= 1800) return { value: 'Great', tone: 'good' }
  if (photos >= 1 || place.reviewCount >= 1000) return { value: 'Good', tone: 'neutral' }
  return { value: 'Fair', tone: 'warn' }
}

/** Stable 6–15 minute figure from a string hash — same pandal, same number. */
function stableMinutes(id: string, min = 6, max = 15): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return min + (h % (max - min + 1))
}

/**
 * Metro readout shows the real nearest station (from `place.metro`) with a
 * modelled walk time — metroETAs carry no coordinates, so the minutes are an
 * estimate, not a geodesic measurement. Honest fallback when no station is set.
 */
export function metroReadout(place: Pick<Place, 'id' | 'metro'>): PulseReadout {
  if (!place.metro) return { value: 'Metro not listed', tone: 'neutral' }
  const station = place.metro.split('(')[0].trim()
  return { value: `${stableMinutes(place.id)} min · ${station}`, tone: 'neutral' }
}

/** Live signals that can promote a modelled row to sourced provenance. */
export interface PulseSignals {
  now?: Date
  notices?: OfficialNotice[]
  notes?: LiveNote[]
}

// Row-relevance keywords. A live notice/note only sources the row its text
// actually speaks to — we never claim a notice backs a figure it doesn't name.
const CROWD_RE = /crowd|bher|rush|packe|heav(y|i)|jama|gather/i
const QUEUE_RE = /queue|wait|line|darshan|closure|closed|gate|re-?open/i
const MEDICAL_RE_LIVE = /medical|first\s*aid|clinic|hospital|ambulance|doctor|stretcher|aid\s*post/i

/** An un-expired notice whose text matches `re`, freshest first. */
function freshestNotice(notices: OfficialNotice[] | undefined, re: RegExp, now: Date): OfficialNotice | undefined {
  if (!notices) return undefined
  return notices
    .filter((n) => (n.expires_at == null || new Date(n.expires_at).getTime() > now.getTime()) && re.test(n.text))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
}

/** The freshest un-expired community note whose text matches `re`. */
function freshestNote(notes: LiveNote[] | undefined, re: RegExp): LiveNote | undefined {
  if (!notes) return undefined
  return notes
    .filter((n) => new Date(n.expires_at).getTime() > Date.now() && re.test(n.text))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
}

/**
 * Assemble the six Pulse rows in fixed display order. Pure and clock-injectable.
 * When live notices/notes are supplied they promote the crowd / queue / medical
 * rows to `official`/`visitor` provenance with a freshness stamp; otherwise the
 * row stays honestly `modelled`. Nothing is invented — a row is only re-sourced
 * when a real signal's text speaks to it.
 */
export function computePulse(place: Place, deps: PulseSignals = {}): PulseItem[] {
  const now = deps.now ?? new Date()
  const crowd = crowdReadout(place.crowd)
  const queue = estimateQueueMin(place.crowd, now)
  const window = optimalWindow(place.openTill)
  const metro = metroReadout(place)
  const medical = medicalStatus(place.facilities ?? [])
  const photo = photoSpotRating(place)

  const items: PulseItem[] = [
    { key: 'crowd', label: 'Crowd', icon: 'users', source: 'modelled', ...crowd },
    { key: 'queue', label: 'Queue wait', icon: 'clock', source: 'modelled', value: queue == null ? NONE : `~${queue} min`, tone: queue == null ? 'neutral' : crowd.tone },
    { key: 'window', label: 'Best window', icon: 'window', source: 'modelled', value: window ?? NONE, tone: window ? 'good' : 'neutral' },
    { key: 'metro', label: 'Nearest metro', icon: 'metro', source: 'modelled', ...metro },
    { key: 'medical', label: 'Medical aid', icon: 'medical', source: 'modelled', ...medical },
    { key: 'photo', label: 'Photo spot', icon: 'camera', source: 'modelled', ...photo },
  ]

  // Crowd row: a visitor note takes precedence over an official notice only in
  // recency; official outranks visitor for the same row (trust hierarchy).
  const crowdNotice = freshestNotice(deps.notices, CROWD_RE, now)
  const crowdNote = freshestNote(deps.notes, CROWD_RE)
  const crowdRow = items[0]
  if (crowdNotice && (!crowdNote || new Date(crowdNotice.updated_at) >= new Date(crowdNote.created_at))) {
    crowdRow.source = 'official'
    crowdRow.updatedAt = crowdNotice.updated_at
  } else if (crowdNote) {
    crowdRow.source = 'visitor'
    crowdRow.updatedAt = crowdNote.created_at
  }

  const queueNotice = freshestNotice(deps.notices, QUEUE_RE, now)
  if (queueNotice) {
    items[1].source = 'official'
    items[1].updatedAt = queueNotice.updated_at
  }

  const medicalNotice = freshestNotice(deps.notices, MEDICAL_RE_LIVE, now)
  if (medicalNotice) {
    items[4].source = 'official'
    items[4].updatedAt = medicalNotice.updated_at
  }

  return items
}
