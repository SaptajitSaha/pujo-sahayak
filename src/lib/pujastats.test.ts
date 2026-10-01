import { describe, it, expect } from 'vitest'
import { computePujaStats } from './pujastats'
import type { Checkin } from './scorecard'

// Local-hour constructors keep getHours() deterministic across machines.
const at = (day: number, hour: number, placeId: string, lat: number, lng: number, tithi: Checkin['tithi']): Checkin => ({
  placeId, tithi, ts: new Date(2026, 9, day, hour, 0, 0).getTime(), lat, lng, accuracyM: 20,
})

describe('computePujaStats', () => {
  it('is all-zero for no check-ins', () => {
    const s = computePujaStats({ checkins: [], saved: 0, visited: 0 })
    expect(s.totalCheckins).toBe(0)
    expect(s.distinctPandals).toBe(0)
    expect(s.distinctTithis).toBe(0)
    expect(s.busiestHour).toBeNull()
    expect(s.quietestHour).toBeNull()
    expect(s.totalKm).toBe(0)
  })

  it('counts distinct pandals and tithis from real check-ins only', () => {
    const s = computePujaStats({
      checkins: [
        at(5, 19, 'p1', 22.5, 88.35, 'saptami'),
        at(5, 20, 'p2', 22.52, 88.36, 'saptami'),
        at(6, 18, 'p1', 22.5, 88.35, 'ashtami'),
      ],
      saved: 0,
      visited: 0,
    })
    expect(s.totalCheckins).toBe(3)
    expect(s.distinctPandals).toBe(2)
    expect(s.distinctTithis).toBe(2)
  })

  it('sums straight-line km across chronological check-ins', () => {
    // Two fixes ~2.2 km apart on the same day.
    const s = computePujaStats({
      checkins: [at(5, 20, 'p2', 22.52, 88.36, 'saptami'), at(5, 19, 'p1', 22.5, 88.35, 'saptami')],
      saved: 0,
      visited: 0,
    })
    expect(s.totalKm).toBeGreaterThan(1)
    expect(s.totalKm).toBeLessThan(4)
  })

  it('finds the busiest and quietest visiting hour (ties favour the earlier hour)', () => {
    const s = computePujaStats({
      checkins: [
        at(5, 21, 'p1', 22.5, 88.35, 'saptami'),
        at(5, 21, 'p2', 22.51, 88.35, 'saptami'),
        at(5, 21, 'p3', 22.52, 88.35, 'saptami'),
        at(6, 12, 'p4', 22.53, 88.35, 'ashtami'),
      ],
      saved: 0,
      visited: 0,
    })
    expect(s.busiestHour).toBe(21)
    expect(s.quietestHour).toBe(12)
  })

  it('reports visited/saved ratio only when there is something saved', () => {
    expect(computePujaStats({ checkins: [], saved: 0, visited: 0 }).savedVsVisited).toBeNull()
    expect(computePujaStats({ checkins: [], saved: 4, visited: 1 }).savedVsVisited).toBeCloseTo(0.25, 5)
  })

  it('pandals-per-day is distinct pandals over active days', () => {
    const s = computePujaStats({
      checkins: [
        at(5, 19, 'p1', 22.5, 88.35, 'saptami'),
        at(5, 20, 'p2', 22.51, 88.35, 'saptami'),
        at(6, 19, 'p3', 22.52, 88.35, 'ashtami'),
      ],
      saved: 0,
      visited: 0,
    })
    // 3 distinct pandals across 2 active days.
    expect(s.pandalsPerDay).toBeCloseTo(1.5, 5)
  })
})
