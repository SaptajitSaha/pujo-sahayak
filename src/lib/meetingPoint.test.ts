import { describe, it, expect } from 'vitest'
import { centroid, suggestMeetingPoint } from './meetingPoint'

// Real, coordinate-bearing public spots (safety points from the demo roster).
const SPOTS = [
  { id: 's1', name: 'Police Station', detail: 'Ballygunge', lat: 22.5270, lng: 88.3600 },
  { id: 's2', name: 'Medical Camp', detail: 'Deshapriya', lat: 22.5085, lng: 88.3415 },
  { id: 's3', name: 'Help Desk', detail: 'Central', lat: 22.5250, lng: 88.3580 },
]

describe('centroid', () => {
  it('is the origin for an empty list', () => {
    expect(centroid([])).toEqual({ lat: 0, lng: 0 })
  })
  it('averages every coordinate', () => {
    expect(centroid([
      { lat: 22.5, lng: 88.34 },
      { lat: 22.6, lng: 88.36 },
    ])).toEqual({ lat: 22.55, lng: 88.35 })
  })
  it('returns the single point unchanged', () => {
    expect(centroid([{ lat: 10, lng: 20 }])).toEqual({ lat: 10, lng: 20 })
  })
})

describe('suggestMeetingPoint', () => {
  it('returns null when there is nothing to work with', () => {
    expect(suggestMeetingPoint([], SPOTS)).toBeNull()
    expect(suggestMeetingPoint([{ lat: 22.5, lng: 88.35 }], [])).toBeNull()
  })

  it('picks the real spot nearest the middle of the origins', () => {
    // Two origins straddle the Help Desk (s3); it sits closest to the centroid.
    const s = suggestMeetingPoint(
      [{ lat: 22.53, lng: 88.36 }, { lat: 22.52, lng: 88.356 }],
      SPOTS,
    )
    expect(s?.spot.id).toBe('s3')
  })

  it('never invents a location — the answer is always one of the spots', () => {
    const s = suggestMeetingPoint([{ lat: 22.51, lng: 88.34 }], SPOTS)
    expect(SPOTS.some((x) => x.id === s?.spot.id)).toBe(true)
  })

  it('reports a straight-line distance from each origin to the chosen spot', () => {
    // A single origin that *is* the Help Desk: it must be picked, at ~0 km.
    const s = suggestMeetingPoint([{ lat: 22.5250, lng: 88.3580 }], SPOTS)
    expect(s?.spot.id).toBe('s3')
    expect(s!.distancesKm[0]).toBeLessThan(0.05)
    // Two origins → one distance each, and farthestKm is their max (consistent).
    const two = suggestMeetingPoint(
      [{ lat: 22.5270, lng: 88.3600 }, { lat: 22.5085, lng: 88.3415 }],
      SPOTS,
    )
    expect(two!.distancesKm).toHaveLength(2)
    expect(two!.farthestKm).toBeCloseTo(Math.max(...two!.distancesKm), 10)
  })

  it('is deterministic for the same input', () => {
    const o = [{ lat: 22.51, lng: 88.34 }, { lat: 22.527, lng: 88.36 }]
    const a = suggestMeetingPoint(o, SPOTS)
    const b = suggestMeetingPoint(o, SPOTS)
    expect(a?.spot.id).toBe(b?.spot.id)
  })
})
