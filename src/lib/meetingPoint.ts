import { haversineKm, type Coords } from './geo'

/** A real, coordinate-bearing public spot people can actually find (safety point). */
export interface MeetingSpot {
  id: string
  name: string
  detail?: string
  lat: number
  lng: number
}

export interface MeetingSuggestion {
  /** The chosen real spot — always one of the ones handed in, never invented. */
  spot: MeetingSpot
  /** The geometric middle of every origin coordinate. */
  centroid: Coords
  /** Straight-line km from each origin to the chosen spot (same order as input). */
  distancesKm: number[]
  /** The longest of those distances — how far the most-out-of-the-way person is. */
  farthestKm: number
}

/** Mean coordinate of a list of origins; the origin for an empty list. */
export function centroid(origins: Coords[]): Coords {
  if (origins.length === 0) return { lat: 0, lng: 0 }
  const sum = origins.reduce((a, o) => ({ lat: a.lat + o.lat, lng: a.lng + o.lng }), { lat: 0, lng: 0 })
  return { lat: sum.lat / origins.length, lng: sum.lng / origins.length }
}

/**
 * Fair meeting point: the *real* known spot nearest the middle of everyone's
 * areas. Honest by construction — the answer is always one of `spots`, so it can
 * only ever name a place that exists; it never fabricates coordinates. Returns
 * null when there is nothing to average or nothing to choose from. Distances are
 * straight-line (haversine), so callers label them "approx".
 */
export function suggestMeetingPoint(origins: Coords[], spots: MeetingSpot[]): MeetingSuggestion | null {
  if (origins.length === 0 || spots.length === 0) return null
  const c = centroid(origins)
  let best = spots[0]
  let bestD = Infinity
  for (const s of spots) {
    const d = haversineKm(c.lat, c.lng, s.lat, s.lng)
    if (d < bestD) { bestD = d; best = s }
  }
  const distancesKm = origins.map((o) => haversineKm(o.lat, o.lng, best.lat, best.lng))
  return { spot: best, centroid: c, distancesKm, farthestKm: Math.max(...distancesKm) }
}
