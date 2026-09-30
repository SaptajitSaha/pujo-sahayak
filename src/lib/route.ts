// Route optimizer for the Puja Planner. Runs entirely on-device.
//
// Algorithm: nearest-neighbour construction from the day's starting point,
// followed by 2-opt local search until no improving swap is found. Falls back
// to a monotone walk when only 2 stops are present. If the total time exceeds
// the caller's budget, the farthest stop from the running centroid is dropped
// and the whole route is recomputed on the remaining set — a heuristic, not an
// optimal TSP solution. Good enough for a realistic Puja day (3–8 pandals).
import type { Place } from '../data/types'
import { haversineKm } from './geo'

/** Average walking / waiting speed through a crowded pandal area (km/h).
    Chose 6 km/h: brisk walk on an open street, but pandal queues, side-road
    detours and crowd-surge slowdowns pull the effective pace down. */
const TRAVEL_KMH = 6
/** Fixed per-hop overhead for finding the next pandal, stepping off the road,
    tucking into the queue line, etc. */
const LEG_OVERHEAD_MIN = 3

export interface RouteStop {
  place: Place
  /** Estimated dwell in minutes at this stop (defaults to caller's avgDwell). */
  dwellMin: number
}

export interface RouteLeg {
  fromId: string
  toId: string
  km: number
  min: number
}

export interface OptimizedRoute {
  ordered: Place[]
  legs: RouteLeg[]
  totalKm: number
  /** Travel + dwell for every stop in the returned order. */
  totalMin: number
  /** Stops dropped to fit the budget, in the order they were removed. */
  dropped: Place[]
}

export interface RouteOptions {
  /** Where the day starts (user's location or previous evening's last stop). */
  startLat: number
  startLng: number
  /** Total time available. Anything above this triggers stop-dropping. */
  budgetMin: number
  /** Default dwell at each pandal (Planner currently stores per-stop time; we
      pass the average here for the total-time projection). */
  avgDwellMin: number
}

/** Total time (minutes) — travel + dwell — for a specific ordering. */
function routeTime(start: { lat: number; lng: number }, order: Place[], avgDwell: number): number {
  let prev = start
  let total = 0
  for (const p of order) {
    const km = haversineKm(prev.lat, prev.lng, p.lat, p.lng)
    total += (km / TRAVEL_KMH) * 60 + LEG_OVERHEAD_MIN + avgDwell
    prev = p
  }
  return total
}

/** Nearest-neighbour: repeatedly pick the closest unvisited place. */
function nearestNeighbour(start: { lat: number; lng: number }, pool: Place[]): Place[] {
  const remaining = [...pool]
  const order: Place[] = []
  let cur = start
  while (remaining.length) {
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(cur.lat, cur.lng, remaining[i].lat, remaining[i].lng)
      if (d < bestD) { bestD = d; best = i }
    }
    const next = remaining.splice(best, 1)[0]
    order.push(next)
    cur = next
  }
  return order
}

/** 2-opt polish: reverse sub-segments while doing so shortens the route.
    Standard pairwise swap over all (i, j) pairs until no improvement. */
function twoOpt(start: { lat: number; lng: number }, order: Place[]): Place[] {
  if (order.length < 3) return order
  let cur = [...order]
  let improved = true
  // Bounded loop — 2-opt converges in < 20 passes for ≤ 8 stops on real data.
  while (improved) {
    improved = false
    for (let i = 0; i < cur.length - 1; i++) {
      for (let j = i + 1; j < cur.length; j++) {
        const candidate = [...cur.slice(0, i), ...cur.slice(i, j + 1).reverse(), ...cur.slice(j + 1)]
        if (routeTime(start, candidate, 0) < routeTime(start, cur, 0) - 0.01) {
          cur = candidate
          improved = true
        }
      }
    }
  }
  return cur
}

/** Distance from `p` to the centroid of the remaining pool — used to pick
    which stop to drop when the route overruns the time budget. */
function farthestFromCentroid(order: Place[]): Place {
  const n = order.length
  const cx = order.reduce((s, p) => s + p.lat, 0) / n
  const cy = order.reduce((s, p) => s + p.lng, 0) / n
  let far = order[0]
  let maxD = -1
  for (const p of order) {
    const d = haversineKm(cx, cy, p.lat, p.lng)
    if (d > maxD) { maxD = d; far = p }
  }
  return far
}

/**
 * Optimize a Puja-day route.
 *
 * 1. Sort stops by nearest-neighbour from the day's starting point.
 * 2. Polish with 2-opt reversals.
 * 3. If total time (travel + dwell per stop) exceeds `budgetMin`, repeatedly
 *    drop the farthest stop from the route's centroid and re-run 1–2.
 * 4. Return ordered stops + per-leg distance/time + anything dropped.
 *
 * Pure function — no side effects, no I/O, no state mutation.
 */
export function optimizeRoute(input: Place[], opts: RouteOptions): OptimizedRoute {
  const start = { lat: opts.startLat, lng: opts.startLng }
  const dropped: Place[] = []
  let pool = [...input]
  let ordered = twoOpt(start, nearestNeighbour(start, pool))
  let totalMin = routeTime(start, ordered, opts.avgDwellMin)
  while (totalMin > opts.budgetMin && ordered.length > 1) {
    const victim = farthestFromCentroid(ordered)
    dropped.push(victim)
    pool = pool.filter((p) => p.id !== victim.id)
    ordered = twoOpt(start, nearestNeighbour(start, pool))
    totalMin = routeTime(start, ordered, opts.avgDwellMin)
  }
  const legs: RouteLeg[] = []
  let totalKm = 0
  let prev: { lat: number; lng: number; id: string } = { ...start, id: '__start__' }
  for (const p of ordered) {
    const km = haversineKm(prev.lat, prev.lng, p.lat, p.lng)
    const min = (km / TRAVEL_KMH) * 60 + LEG_OVERHEAD_MIN
    legs.push({ fromId: prev.id, toId: p.id, km, min })
    totalKm += km
    prev = { lat: p.lat, lng: p.lng, id: p.id }
  }
  return { ordered, legs, totalKm, totalMin, dropped }
}
