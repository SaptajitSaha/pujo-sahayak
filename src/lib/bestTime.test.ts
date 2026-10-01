import { describe, expect, it } from 'vitest'
import { bestWindows, hourIntensity, operatingHours } from './bestTime'

describe('hourIntensity', () => {
  it('peaks in the evening and bottoms out pre-dawn', () => {
    expect(hourIntensity('high', 21)).toBeGreaterThan(hourIntensity('high', 11))
    expect(hourIntensity('high', 4)).toBeLessThan(hourIntensity('high', 18))
  })

  it('scales the whole curve by crowd level, holding the shape', () => {
    // Every hour of a "low" pandal is quieter than the same hour of a "high" one.
    expect(hourIntensity('low', 21)).toBeLessThan(hourIntensity('high', 21))
    expect(hourIntensity('moderate', 14)).toBeLessThan(hourIntensity('high', 14))
  })

  it('wraps negative / overflow hours into the 0–23 grid', () => {
    expect(hourIntensity('high', -1)).toBe(hourIntensity('high', 23))
    expect(hourIntensity('high', 25)).toBe(hourIntensity('high', 1))
  })

  it('falls back to the generic shape (no scaling) without a crowd level', () => {
    expect(hourIntensity(undefined, 21)).toBe(1.0)
  })
})

describe('operatingHours', () => {
  it('runs gate-open to just before the posted close', () => {
    const h = operatingHours('11:30 PM')
    expect(h[0]).toBe(10)
    expect(h).not.toContain(23) // closes at 23 → last open hour is 22
    expect(h[h.length - 1]).toBe(22)
  })

  it('wraps a past-midnight close through 00:00', () => {
    const h = operatingHours('2:00 AM')
    expect(h).toContain(23)
    expect(h).toContain(0)
    expect(h[h.length - 1]).toBe(1)
    expect(h).not.toContain(2)
  })

  it('defaults to an evening window rather than fabricating an all-night schedule', () => {
    const h = operatingHours(undefined)
    expect(h[0]).toBe(10)
    expect(h.length).toBeGreaterThan(0)
    expect(h.every((x) => x >= 10 || x < 22)).toBe(true)
  })
})

describe('bestWindows', () => {
  it('recommends calm morning blocks and flags the ~9pm peak to avoid (high crowd)', () => {
    const r = bestWindows({ crowd: 'high', openTill: '2:00 AM' })
    expect(r.hasCrowdData).toBe(true)
    expect(r.best.length).toBeGreaterThan(0)
    expect(r.best.every((w) => w.rank !== 'busy')).toBe(true)
    expect(r.best[0].label).toBe('10:00 AM–12:00 PM')
    expect(r.avoid?.rank).toBe('busy')
    expect(r.avoid?.label).toBe('9:00 PM–11:00 PM')
  })

  it('never repeats overlapping best blocks', () => {
    const r = bestWindows({ crowd: 'high', openTill: '1:00 AM' })
    for (const a of r.best) {
      for (const b of r.best) {
        if (a !== b) expect(Math.abs(a.startHour - b.startHour)).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('withholds an "avoid" window for a low-crowd pandal (nothing is truly busy)', () => {
    const r = bestWindows({ crowd: 'low', openTill: '11:30 PM' })
    expect(r.avoid).toBeNull()
  })

  it('still returns the generic pattern without crowd data, flagged as such', () => {
    const r = bestWindows({ crowd: undefined, openTill: '2:00 AM' })
    expect(r.hasCrowdData).toBe(false)
    expect(r.best.length).toBeGreaterThan(0)
  })
})
