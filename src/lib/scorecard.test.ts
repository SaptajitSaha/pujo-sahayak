import { describe, expect, it } from 'vitest'
import {
  CHECKIN_RADIUS_M,
  MAX_ACCURACY_M,
  evaluateBadges,
  evaluateCheckIn,
  longestStreak,
  scorecardSummary,
  tithiForTs,
  withinGeofence,
  type Checkin,
} from './scorecard'

/** A point ~100 m north of a base latitude, for geofence boundary tests. */
const north = (lat: number, meters: number) => lat + meters / 111320

const PANDAL = { lat: 22.5456, lng: 88.3544 }

/**
 * Instants are written with an explicit +05:30 offset throughout: the puja
 * calendar is Kolkata's, so a test must not change meaning with the timezone
 * of the machine running it.
 */
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

  it('widens the gate to the device accuracy, but only up to the cap', () => {
    // 200 m out with an honest ±250 m fix — still plausible, so allow.
    expect(withinGeofence({ lat: north(PANDAL.lat, 200), lng: PANDAL.lng }, PANDAL, 250)).toBe(true)
    // 280 m out at ±250 m: the widened gate is 250 m, so this is beyond it.
    expect(withinGeofence({ lat: north(PANDAL.lat, 280), lng: PANDAL.lng }, PANDAL, 250)).toBe(false)
  })

  it('refuses a fix worse than the cap no matter how far the user appears to be', () => {
    // Regression: a ±2 km positioning fix used to validate a user 1.5 km away
    // as "GPS-verified on-site", because the gate grew to the reported accuracy.
    expect(withinGeofence({ lat: north(PANDAL.lat, 1500), lng: PANDAL.lng }, PANDAL, 2000)).toBe(false)
    expect(withinGeofence({ lat: north(PANDAL.lat, 50), lng: PANDAL.lng }, PANDAL, MAX_ACCURACY_M + 1)).toBe(false)
  })

  it('keeps the default radius when no accuracy is supplied', () => {
    expect(CHECKIN_RADIUS_M).toBe(150)
    expect(MAX_ACCURACY_M).toBeGreaterThan(CHECKIN_RADIUS_M)
    expect(withinGeofence({ lat: north(PANDAL.lat, 100), lng: PANDAL.lng }, PANDAL)).toBe(true)
    expect(withinGeofence({ lat: north(PANDAL.lat, 300), lng: PANDAL.lng }, PANDAL)).toBe(false)
  })
})

describe('evaluateCheckIn', () => {
  it('names an unusable fix differently from a genuinely distant one', () => {
    expect(evaluateCheckIn({ lat: north(PANDAL.lat, 20), lng: PANDAL.lng }, PANDAL, 5000)).toBe('poor-signal')
    expect(evaluateCheckIn({ lat: north(PANDAL.lat, 4000), lng: PANDAL.lng }, PANDAL, 30)).toBe('far')
    expect(evaluateCheckIn({ lat: north(PANDAL.lat, 40), lng: PANDAL.lng }, PANDAL, 30)).toBe('ok')
  })
})

describe('tithiForTs', () => {
  it('maps a Kolkata date inside the 2026 window to its plan day', () => {
    expect(tithiForTs(new Date('2026-10-06T18:30:00+05:30').getTime())).toBe('ashtami')
    expect(tithiForTs(new Date('2026-10-03T07:00:00+05:30').getTime())).toBe('panchami')
    expect(tithiForTs(new Date('2026-10-08T23:00:00+05:30').getTime())).toBe('dashami')
  })

  it('uses the Kolkata calendar day, not the UTC one, just after local midnight', () => {
    // 00:15 IST on Shashthi is still 18:45 UTC the previous day; a
    // toISOString()-based lookup would call this Panchami (or nothing).
    expect(tithiForTs(new Date('2026-10-04T00:15:00+05:30').getTime())).toBe('shashthi')
  })

  it('ends the window on the Kolkata day, not while UTC is still inside it', () => {
    // 00:10 IST on Oct 9 is 18:40 UTC on Oct 8 (Dashami) — puja is over.
    expect(tithiForTs(new Date('2026-10-09T00:10:00+05:30').getTime())).toBeNull()
  })

  it('is independent of the machine timezone (no device-local leakage)', () => {
    // The same instant expressed two ways must map to the same tithi.
    const ist = new Date('2026-10-05T19:00:00+05:30').getTime()
    const utc = new Date('2026-10-05T13:30:00Z').getTime()
    expect(ist).toBe(utc)
    expect(tithiForTs(utc)).toBe('saptami')
  })

  it('returns null outside the puja window (never invents a tithi)', () => {
    expect(tithiForTs(new Date('2026-09-30T12:00:00+05:30').getTime())).toBeNull()
    expect(tithiForTs(new Date('2026-10-09T12:00:00+05:30').getTime())).toBeNull()
  })
})

describe('longestStreak', () => {
  it('counts consecutive Kolkata days with at least one check-in', () => {
    const cs = [
      cin('a', '2026-10-03T19:00:00+05:30'),
      cin('b', '2026-10-04T20:00:00+05:30'),
      cin('c', '2026-10-05T18:00:00+05:30'),
      cin('d', '2026-10-07T18:00:00+05:30'), // gap on the 6th
    ]
    expect(longestStreak(cs)).toBe(3)
  })

  it('keeps a pre-dawn check-in on its own Kolkata day', () => {
    // 00:30 IST on the 5th is the 4th in UTC; the streak must follow Kolkata.
    const cs = [
      cin('a', '2026-10-04T20:00:00+05:30'),
      cin('b', '2026-10-05T00:30:00+05:30'),
    ]
    expect(longestStreak(cs)).toBe(2)
  })

  it('treats multiple same-day check-ins as one streak day', () => {
    const cs = [cin('a', '2026-10-05T10:00:00+05:30'), cin('b', '2026-10-05T22:00:00+05:30')]
    expect(longestStreak(cs)).toBe(1)
  })

  it('is 0 for no check-ins', () => {
    expect(longestStreak([])).toBe(0)
  })
})

describe('scorecardSummary', () => {
  it('counts unique pandals and tithis from the check-in log', () => {
    const cs = [
      cin('a', '2026-10-05T18:00:00+05:30', { tithi: 'saptami' }),
      cin('a', '2026-10-05T21:00:00+05:30', { tithi: 'saptami' }), // same pandal again
      cin('b', '2026-10-06T18:00:00+05:30', { tithi: 'ashtami' }),
    ]
    const s = scorecardSummary(cs)
    expect(s.pandals).toBe(2)
    expect(s.tithis).toBe(2)
    expect(s.streak).toBe(2)
  })
})

describe('evaluateBadges', () => {
  it('first-darshan unlocks on the very first pandal check-in', () => {
    const cs = [cin('p1', '2026-10-05T18:00:00+05:30')]
    const badges = evaluateBadges(cs, [])
    expect(badges.find((b) => b.def.id === 'first-darshan')?.earned).toBe(true)
    expect(badges.find((b) => b.def.id === 'parjatak')?.earned).toBe(false)
  })

  it('parjatak needs 5 unique pandals, maha-parjatak needs 10', () => {
    const five = Array.from({ length: 5 }, (_, i) => cin(`p${i}`, '2026-10-05T18:00:00+05:30'))
    const ten = Array.from({ length: 10 }, (_, i) => cin(`p${i}`, '2026-10-05T18:00:00+05:30'))
    expect(evaluateBadges(five, []).find((b) => b.def.id === 'parjatak')?.earned).toBe(true)
    expect(evaluateBadges(five, []).find((b) => b.def.id === 'maha-parjatak')?.earned).toBe(false)
    expect(evaluateBadges(ten, []).find((b) => b.def.id === 'maha-parjatak')?.earned).toBe(true)
  })

  it('midnight-darshan fires for late-night Kolkata hours, not device hours', () => {
    const late = [cin('p1', '2026-10-06T22:30:00+05:30')]
    const early = [cin('p1', '2026-10-07T01:00:00+05:30')]
    const day = [cin('p1', '2026-10-06T15:00:00+05:30')]
    // 20:00 UTC is 01:30 IST — a midnight darshan in Kolkata, afternoon nowhere
    // near the device clock; the badge must read it as Kolkata.
    const utcLateEvening = [cin('p1', '2026-10-06T20:00:00Z')]
    expect(evaluateBadges(late, []).find((b) => b.def.id === 'midnight-darshan')?.earned).toBe(true)
    expect(evaluateBadges(early, []).find((b) => b.def.id === 'midnight-darshan')?.earned).toBe(true)
    expect(evaluateBadges(day, []).find((b) => b.def.id === 'midnight-darshan')?.earned).toBe(false)
    expect(evaluateBadges(utcLateEvening, []).find((b) => b.def.id === 'midnight-darshan')?.earned).toBe(true)
  })

  it('walk-finisher needs every stop of a walk checked in', () => {
    const walk = { id: 'w1', title: 'T', description: 'd', theme: 'heritage', totalDurationMin: 60, palette: { from: '#000', to: '#111' }, stops: [{ placeId: 'p1', day: null as never, highlight: 'h', durationMin: 20 }, { placeId: 'p2', day: null as never, highlight: 'h', durationMin: 20 }] } as never
    const partial = [cin('p1', '2026-10-05T18:00:00+05:30')]
    const full = [cin('p1', '2026-10-05T18:00:00+05:30'), cin('p2', '2026-10-05T19:00:00+05:30')]
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
