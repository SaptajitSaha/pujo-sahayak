import { describe, expect, it } from 'vitest'
import {
  CHECKIN_RADIUS_M,
  evaluateBadges,
  longestStreak,
  scorecardSummary,
  tithiForTs,
  withinGeofence,
  type Checkin,
} from './scorecard'

/** A point ~100 m north of a base latitude, for geofence boundary tests. */
const north = (lat: number, meters: number) => lat + meters / 111320

const PANDAL = { lat: 22.5456, lng: 88.3544 }

const cin = (placeId: string, at: string, extra?: Partial<Checkin>): Checkin => ({
  placeId,
  tithi: null,
  ts: new Date(at).getTime(),
  lat: PANDAL.lat,
  lng: PANDAL.lng,
  accuracyM: 20,
  ...extra,
})

describe('withinGeofence', () => {
  it('accepts a user well inside the radius', () => {
    expect(withinGeofence({ lat: north(PANDAL.lat, 50), lng: PANDAL.lng }, PANDAL, 20)).toBe(true)
  })

  it('rejects a user beyond the radius with tight GPS accuracy', () => {
    expect(withinGeofence({ lat: north(PANDAL.lat, 400), lng: PANDAL.lng }, PANDAL, 20)).toBe(false)
  })

  it('widens the gate when the reported GPS accuracy exceeds the radius', () => {
    // 400 m away but the device itself reports a 500 m accuracy circle — honest allow.
    expect(withinGeofence({ lat: north(PANDAL.lat, 400), lng: PANDAL.lng }, PANDAL, 500)).toBe(true)
  })

  it('keeps the default radius when no accuracy is supplied', () => {
    expect(CHECKIN_RADIUS_M).toBe(150)
    expect(withinGeofence({ lat: north(PANDAL.lat, 100), lng: PANDAL.lng }, PANDAL)).toBe(true)
    expect(withinGeofence({ lat: north(PANDAL.lat, 300), lng: PANDAL.lng }, PANDAL)).toBe(false)
  })
})

describe('tithiForTs', () => {
  it('maps a local date inside the 2026 window to its plan day', () => {
    expect(tithiForTs(new Date('2026-10-06T18:30:00').getTime())).toBe('ashtami')
    expect(tithiForTs(new Date('2026-10-03T07:00:00').getTime())).toBe('panchami')
    expect(tithiForTs(new Date('2026-10-08T23:00:00').getTime())).toBe('dashami')
  })

  it('returns null outside the puja window (never invents a tithi)', () => {
    expect(tithiForTs(new Date('2026-09-30T12:00:00').getTime())).toBeNull()
    expect(tithiForTs(new Date('2026-10-09T12:00:00').getTime())).toBeNull()
  })
})

describe('longestStreak', () => {
  it('counts consecutive local days with at least one check-in', () => {
    const cs = [
      cin('a', '2026-10-03T19:00:00'),
      cin('b', '2026-10-04T20:00:00'),
      cin('c', '2026-10-05T18:00:00'),
      cin('d', '2026-10-07T18:00:00'), // gap on the 6th
    ]
    expect(longestStreak(cs)).toBe(3)
  })

  it('treats multiple same-day check-ins as one streak day', () => {
    const cs = [cin('a', '2026-10-05T10:00:00'), cin('b', '2026-10-05T22:00:00')]
    expect(longestStreak(cs)).toBe(1)
  })

  it('is 0 for no check-ins', () => {
    expect(longestStreak([])).toBe(0)
  })
})

describe('scorecardSummary', () => {
  it('counts unique pandals and tithis from the check-in log', () => {
    const cs = [
      cin('a', '2026-10-05T18:00:00', { tithi: 'saptami' }),
      cin('a', '2026-10-05T21:00:00', { tithi: 'saptami' }), // same pandal again
      cin('b', '2026-10-06T18:00:00', { tithi: 'ashtami' }),
    ]
    const s = scorecardSummary(cs)
    expect(s.pandals).toBe(2)
    expect(s.tithis).toBe(2)
    expect(s.streak).toBe(2)
  })
})

describe('evaluateBadges', () => {
  it('first-darshan unlocks on the very first pandal check-in', () => {
    const cs = [cin('p1', '2026-10-05T18:00:00')]
    const badges = evaluateBadges(cs, [])
    expect(badges.find((b) => b.def.id === 'first-darshan')?.earned).toBe(true)
    expect(badges.find((b) => b.def.id === 'parjatak')?.earned).toBe(false)
  })

  it('parjatak needs 5 unique pandals, maha-parjatak needs 10', () => {
    const five = Array.from({ length: 5 }, (_, i) => cin(`p${i}`, '2026-10-05T18:00:00'))
    const ten = Array.from({ length: 10 }, (_, i) => cin(`p${i}`, '2026-10-05T18:00:00'))
    expect(evaluateBadges(five, []).find((b) => b.def.id === 'parjatak')?.earned).toBe(true)
    expect(evaluateBadges(five, []).find((b) => b.def.id === 'maha-parjatak')?.earned).toBe(false)
    expect(evaluateBadges(ten, []).find((b) => b.def.id === 'maha-parjatak')?.earned).toBe(true)
  })

  it('midnight-darshan fires for a check-in at/after 22:00 or before 02:00', () => {
    const late = [cin('p1', '2026-10-06T22:30:00')]
    const early = [cin('p1', '2026-10-07T01:00:00')]
    const day = [cin('p1', '2026-10-06T15:00:00')]
    expect(evaluateBadges(late, []).find((b) => b.def.id === 'midnight-darshan')?.earned).toBe(true)
    expect(evaluateBadges(early, []).find((b) => b.def.id === 'midnight-darshan')?.earned).toBe(true)
    expect(evaluateBadges(day, []).find((b) => b.def.id === 'midnight-darshan')?.earned).toBe(false)
  })

  it('walk-finisher needs every stop of a walk checked in', () => {
    const walk = { id: 'w1', title: 'T', description: 'd', theme: 'heritage', totalDurationMin: 60, palette: { from: '#000', to: '#111' }, stops: [{ placeId: 'p1', day: null as never, highlight: 'h', durationMin: 20 }, { placeId: 'p2', day: null as never, highlight: 'h', durationMin: 20 }] } as never
    const partial = [cin('p1', '2026-10-05T18:00:00')]
    const full = [cin('p1', '2026-10-05T18:00:00'), cin('p2', '2026-10-05T19:00:00')]
    expect(evaluateBadges(partial, [walk]).find((b) => b.def.id === 'walk-finisher')?.earned).toBe(false)
    expect(evaluateBadges(full, [walk]).find((b) => b.def.id === 'walk-finisher')?.earned).toBe(true)
  })

  it('exposes a stable badge list the UI can render', () => {
    const badges = evaluateBadges([], [])
    expect(badges.map((b) => b.def.id)).toEqual([
      'first-darshan',
      'parjatak',
      'maha-parjatak',
      'tithi-trotter',
      'midnight-darshan',
      'walk-finisher',
    ])
    expect(badges.every((b) => !b.earned)).toBe(true)
  })
})
