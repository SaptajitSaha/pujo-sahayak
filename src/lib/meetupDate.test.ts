import { describe, expect, it } from 'vitest'
import { isUpcoming, parseMeetupStart } from './meetupDate'

// The seeded meetup date is display text ('Sat, 12 Oct'), which no code could
// compare against "now" — so past meetups kept rendering as if upcoming.
// Expected instants are built with new Date(...) in local time to match the
// parser, keeping these tests valid on any host timezone.

const NOW = new Date(2026, 9, 2, 12, 0) // 2 Oct 2026, before the puja week

describe('parseMeetupStart', () => {
  it('reads the seeded display form with a 12-hour time', () => {
    expect(parseMeetupStart('Sat, 12 Oct', '7:00 PM', NOW)).toEqual(new Date(2026, 9, 12, 19, 0))
    expect(parseMeetupStart('Sun, 13 Oct', '5:00 AM', NOW)).toEqual(new Date(2026, 9, 13, 5, 0))
  })

  it('reads the ISO form a user date input produces, with a 24-hour time', () => {
    expect(parseMeetupStart('2026-10-12', '19:00', NOW)).toEqual(new Date(2026, 9, 12, 19, 0))
  })

  it('rolls a label whose month has passed into next year rather than going stale', () => {
    const jan = new Date(2027, 0, 5)
    expect(parseMeetupStart('Fri, 12 Feb', '6:00 PM', jan)).toEqual(new Date(2027, 1, 12, 18, 0))
    // October already behind us in this frame → next October.
    const november = new Date(2026, 10, 1)
    expect(parseMeetupStart('Sat, 12 Oct', '7:00 PM', november)?.getFullYear()).toBe(2027)
  })

  it('returns null instead of a rolled-over guess for impossible dates and unreadable labels', () => {
    expect(parseMeetupStart('31 Feb', '6:00 PM', NOW)).toBeNull()
    expect(parseMeetupStart('whenever, sometime', '6:00 PM', NOW)).toBeNull()
    expect(parseMeetupStart('12 Xyz', '6:00 PM', NOW)).toBeNull()
    expect(parseMeetupStart('2026-10-12', '25:00', NOW)).toBeNull()
  })
})

describe('isUpcoming', () => {
  it('is true for a meetup later in the puja week', () => {
    expect(isUpcoming('Sat, 12 Oct', '7:00 PM', NOW)).toBe(true)
  })

  it('is false once the meetup has started', () => {
    const late = new Date(2026, 9, 14, 23, 0) // after the 9:30 PM crawl
    expect(isUpcoming('Mon, 14 Oct', '9:30 PM', late)).toBe(false)
  })

  it('keeps a meetup whose date it cannot read (fail open, never hide content)', () => {
    expect(isUpcoming('TBD', 'evening', NOW)).toBe(true)
  })
})
