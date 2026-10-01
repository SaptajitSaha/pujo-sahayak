import { describe, expect, it } from 'vitest'
import {
  computePulse,
  crowdReadout,
  estimateQueueMin,
  medicalStatus,
  metroReadout,
  optimalWindow,
  photoSpotRating,
  type PulseItem,
} from './pulse'
import type { CrowdLevel, LiveNote, OfficialNotice, Place } from '../data/types'

/**
 * Dates chosen against the 2026 calendar: Oct 7 = Wednesday (weekday),
 * Oct 9 = Friday (weekend). Used to exercise the time/day queue model.
 */
const at = (iso: string) => new Date(iso)

describe('crowdReadout', () => {
  it('maps a seeded crowd level to a colour-coded label', () => {
    expect(crowdReadout('high')).toEqual({ value: 'High', tone: 'bad' })
    expect(crowdReadout('moderate')).toEqual({ value: 'Moderate', tone: 'warn' })
    expect(crowdReadout('low')).toEqual({ value: 'Low', tone: 'good' })
  })

  it('is honest when no crowd level is on record', () => {
    expect(crowdReadout(undefined)).toEqual({ value: 'Not reported', tone: 'neutral' })
  })
})

describe('estimateQueueMin', () => {
  it('returns null without a crowd level (never invents a wait)', () => {
    expect(estimateQueueMin(undefined, at('2026-10-07T21:00:00'))).toBeNull()
  })

  it('uses the base wait off-peak on a weekday', () => {
    // Wednesday 15:00 — not a puja-evening peak, not a weekend.
    expect(estimateQueueMin('low', at('2026-10-07T15:00:00'))).toBe(5)
    expect(estimateQueueMin('moderate', at('2026-10-07T15:00:00'))).toBe(15)
    expect(estimateQueueMin('high', at('2026-10-07T15:00:00'))).toBe(25)
  })

  it('inflates during the 8pm–2am peak window', () => {
    // Wed 21:00 peak: high base 25 × 1.5 = 37.5 → nearest 5 = 40.
    expect(estimateQueueMin('high', at('2026-10-07T21:00:00'))).toBe(40)
    // Thu 00:30 counts as peak (past-midnight darshan).
    expect(estimateQueueMin('high', at('2026-10-08T00:30:00'))).toBe(40)
  })

  it('adds a weekend surcharge on top of the peak', () => {
    // Friday 21:00: 25 × 1.5 × 1.2 = 45.
    expect(estimateQueueMin('high', at('2026-10-09T21:00:00'))).toBe(45)
  })
})

describe('optimalWindow', () => {
  it('is the quiet hour before the real closing time', () => {
    expect(optimalWindow('2:00 AM')).toBe('1:00 AM–2:00 AM')
    expect(optimalWindow('11:30 PM')).toBe('10:30 PM–11:30 PM')
    expect(optimalWindow('11:45 PM')).toBe('10:45 PM–11:45 PM')
  })

  it('wraps across midnight', () => {
    expect(optimalWindow('12:30 AM')).toBe('11:30 PM–12:30 AM')
    expect(optimalWindow('1:00 AM')).toBe('12:00 AM–1:00 AM')
  })

  it('returns null when there is no posted closing time', () => {
    expect(optimalWindow(undefined)).toBeNull()
    expect(optimalWindow('soon')).toBeNull()
  })
})

describe('medicalStatus', () => {
  it('is Active when the facilities list mentions medical/first-aid', () => {
    expect(medicalStatus(['Help Desk', 'Medical Camp'])).toEqual({ value: 'Active', tone: 'good' })
    expect(medicalStatus(['First Aid point']).value).toBe('Active')
  })

  it('is None listed otherwise', () => {
    expect(medicalStatus(['Help Desk', 'Parking'])).toEqual({ value: 'None listed', tone: 'neutral' })
    expect(medicalStatus([]).value).toBe('None listed')
  })
})

describe('photoSpotRating', () => {
  it('reads Great from a rich photo/review footprint', () => {
    const clicks = [{ likes: 40 }, { likes: 22 }, { likes: 9 }]
    expect(photoSpotRating({ topClicks: clicks, reviewCount: 1200 })).toEqual({ value: 'Great', tone: 'good' })
    expect(photoSpotRating({ topClicks: [], reviewCount: 2300 }).value).toBe('Great')
  })

  it('reads Good with a modest footprint and Fair with none', () => {
    expect(photoSpotRating({ topClicks: [{ likes: 3 }], reviewCount: 1200 }).value).toBe('Good')
    expect(photoSpotRating({ topClicks: [], reviewCount: 500 })).toEqual({ value: 'Fair', tone: 'warn' })
  })
})

describe('metroReadout', () => {
  it('surfaces the real station name with a stable modelled walk', () => {
    const a = metroReadout({ id: 'pandal-santosh-mitra', metro: 'Koley Market (Green Line)' })
    expect(a.tone).toBe('neutral')
    expect(a.value).toContain('Koley Market')
    expect(a.value).toMatch(/\d+ min/)
    // Deterministic: the same pandal always shows the same figure.
    expect(metroReadout({ id: 'pandal-santosh-mitra', metro: 'Koley Market (Green Line)' }).value).toBe(a.value)
  })

  it('is honest when no metro is listed', () => {
    expect(metroReadout({ id: 'x' })).toEqual({ value: 'Metro not listed', tone: 'neutral' })
  })
})

describe('computePulse', () => {
  const base: Place = {
    id: 'pandal-santosh-mitra', type: 'pandal', name: 'Santosh Mitra Square', area: 'Central Kolkata',
    lat: 22.5473, lng: 88.3573, rating: 4.8, reviewCount: 2300, distanceKm: 2.4,
    crowd: 'high' as CrowdLevel, openTill: '2:00 AM', metro: 'Koley Market (Green Line)',
    facilities: ['Help Desk', 'Medical Camp'], palette: { from: '#000', to: '#111' },
    topClicks: [{ id: 'a', title: 't', author: 'x', likes: 10, palette: { from: '#000', to: '#111' } },
      { id: 'b', title: 't', author: 'x', likes: 10, palette: { from: '#000', to: '#111' } },
      { id: 'c', title: 't', author: 'x', likes: 10, palette: { from: '#000', to: '#111' } }],
  }

  it('emits exactly six rows in the fixed order', () => {
    const items: PulseItem[] = computePulse(base, { now: at('2026-10-07T21:00:00') })
    expect(items.map((i) => i.key)).toEqual(['crowd', 'queue', 'window', 'metro', 'medical', 'photo'])
    expect(items.every((i) => i.icon && i.label && i.value)).toBe(true)
  })

  it('collapses a missing queue to an em dash rather than a fake number', () => {
    const sparse: Place = { ...base, crowd: undefined, metro: undefined, facilities: [], topClicks: [], reviewCount: 100, openTill: undefined }
    const items = computePulse(sparse, { now: at('2026-10-07T15:00:00') })
    expect(items.find((i) => i.key === 'queue')?.value).toBe('—')
    expect(items.find((i) => i.key === 'window')?.value).toBe('—')
    expect(items.find((i) => i.key === 'crowd')?.value).toBe('Not reported')
  })

  it('defaults every row to modelled provenance with no live signals', () => {
    const items = computePulse(base, { now: at('2026-10-07T21:00:00') })
    expect(items.every((i) => i.source === 'modelled')).toBe(true)
  })

  const notice = (over: Partial<OfficialNotice>): OfficialNotice => ({
    id: 'n', place_id: 'pandal-santosh-mitra', source: 'Traffic Police', text: '',
    created_at: '2026-10-07T19:00:00Z', updated_at: '2026-10-07T19:00:00Z',
    expires_at: '2027-01-01T00:00:00Z', verification_status: 'official', ...over,
  })
  const note = (over: Partial<LiveNote>): LiveNote => ({
    id: 'm', place_id: 'pandal-santosh-mitra', author_id: null, text: '',
    created_at: '2026-10-07T19:30:00Z', expires_at: '2027-01-01T00:00:00Z',
    moderation_status: 'approved', helpful_count: 0, reported_count: 0, ...over,
  })
  const now = { now: at('2026-10-07T20:00:00') }

  it('promotes the crowd row to visitor provenance from a matching note', () => {
    const items = computePulse(base, { ...now, notes: [note({ text: 'Huge crowd at the gate right now' })] })
    const crowd = items.find((i) => i.key === 'crowd')!
    expect(crowd.source).toBe('visitor')
    expect(crowd.updatedAt).toBe('2026-10-07T19:30:00Z')
  })

  it('ranks an official notice above a visitor note for the same row', () => {
    const items = computePulse(base, {
      ...now,
      notices: [notice({ text: 'Very heavy crowd, expect long waits', updated_at: '2026-10-07T19:45:00Z' })],
      notes: [note({ text: 'Crowd is moderate' })],
    })
    expect(items.find((i) => i.key === 'crowd')!.source).toBe('official')
  })

  it('sources the queue and medical rows from notices that name them', () => {
    const items = computePulse(base, {
      ...now,
      notices: [
        notice({ text: 'Darshan queue currently 90 minutes', updated_at: '2026-10-07T19:50:00Z' }),
        notice({ text: 'Medical aid post relocated to Gate 2', updated_at: '2026-10-07T19:40:00Z' }),
      ],
    })
    expect(items.find((i) => i.key === 'queue')!.source).toBe('official')
    expect(items.find((i) => i.key === 'medical')!.source).toBe('official')
  })

  it('ignores expired notices when attributing provenance', () => {
    const items = computePulse(base, {
      ...now,
      notices: [notice({ text: 'Crowd surge expected', expires_at: '2000-01-01T00:00:00Z' })],
    })
    expect(items.find((i) => i.key === 'crowd')!.source).toBe('modelled')
  })
})
