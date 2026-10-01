// "What should I do next?" — recommendations scored from the user's REAL state.
//
// Honesty rule (doc §58, §37 no-gimmick): a suggestion is only ever justified by
// facts already on the device — a stop on tonight's plan, a saved place (+ its
// intent), distance from the user's location, and the pandal's posted hours /
// seeded crowd level. Nothing is invented, no popularity is fabricated, and a
// place the user has already visited or checked into today is never re-suggested.

import type { PlanDay, PlanStop, Place, SaveIntent } from '../data/types'
import { haversineKm } from './geo'
import { operatingHours } from './bestTime'

export interface WhatsNextInput {
  user: { lat: number; lng: number }
  now: Date
  /** The current tithi's planned stops, if any. */
  todayPlan?: PlanStop[]
  todayDay?: PlanDay | null
  saved: string[]
  saveIntents?: Record<string, SaveIntent>
  visited: string[]
  /** Place IDs already GPS-checked-in (today) — excluded from suggestions. */
  checkedIn?: string[]
  /** City-scoped candidate places (pandals + restaurants the app actually has). */
  candidates: Place[]
}

export interface NextSuggestion {
  place: Place
  /** Short human reason, e.g. "Planned for saptami · 1.2 km · open till 11 PM". */
  reason: string
  score: number
}

const INTENT_LABEL: Record<SaveIntent, string> = {
  tonight: 'saved for tonight',
  'on-saptami': 'saved for saptami',
  'with-friends': 'saved to go with friends',
  'for-photography': 'saved for photography',
  'food-trip': 'saved as a food trip',
  'visit-later': 'saved to visit later',
}

function isOpenNow(place: Place, now: Date): boolean {
  // Pandal hours are modelled from its posted close; a place with no hours is
  // treated as not-claimably-open so we never assert availability we can't back.
  if (!place.openTill) return false
  return operatingHours(place.openTill).includes(now.getHours())
}

/**
 * Score and rank suggestions. Places in today's plan or saved (esp. "tonight")
 * lead; closer is better; open-now beats closed; a low seeded crowd is a mild
 * comfort bonus. Returns up to `limit` with honest reason strings.
 */
export function suggestNext(input: WhatsNextInput, limit = 3): NextSuggestion[] {
  const { user, now } = input
  const planIds = new Set((input.todayPlan ?? []).map((s) => s.placeId))
  const skip = new Set<string>([...input.visited, ...(input.checkedIn ?? [])])

  // Candidate pool = planned + saved places the user hasn't already done today.
  const wanted = new Set<string>([...planIds, ...input.saved])
  const byId = new Map(input.candidates.map((p) => [p.id, p]))

  const scored: NextSuggestion[] = []
  for (const id of wanted) {
    if (skip.has(id)) continue
    const place = byId.get(id)
    if (!place) continue

    const reasons: string[] = []
    let score = 0

    if (planIds.has(id)) {
      score += 40
      reasons.push(input.todayDay ? `on your ${input.todayDay} plan` : 'on your plan')
    }
    const intent = input.saveIntents?.[id]
    if (intent) {
      score += intent === 'tonight' ? 30 : 15
      reasons.push(INTENT_LABEL[intent])
    }

    const km = haversineKm(user.lat, user.lng, place.lat, place.lng)
    score += Math.max(0, 20 - km * 4)
    reasons.push(`${km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km'}`)

    if (isOpenNow(place, now)) {
      score += 12
      reasons.push(`open till ${place.openTill}`)
    }
    if (place.type === 'pandal' && place.crowd === 'low') {
      score += 6
      reasons.push('quiet now (modelled)')
    }

    scored.push({ place, reason: reasons.join(' · '), score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
