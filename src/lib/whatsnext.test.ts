import { describe, expect, it } from 'vitest'
import { suggestNext, type WhatsNextInput } from './whatsnext'
import type { Place } from '../data/types'

const place = (over: Partial<Place> & Pick<Place, 'id'>): Place => ({
  type: 'pandal', name: over.id, area: 'Kolkata', lat: 22.5626, lng: 88.363,
  rating: 4.5, reviewCount: 100, distanceKm: 1, facilities: [],
  palette: { from: '#000', to: '#111' }, ...over,
})

const USER = { lat: 22.5626, lng: 88.363 }
// 8pm — inside the modelled evening operating window.
const NOW = new Date(2026, 9, 7, 20, 0, 0)

const base: WhatsNextInput = {
  user: USER, now: NOW, saved: [], visited: [], checkedIn: [], candidates: [],
}

describe('suggestNext', () => {
  it('returns nothing when the user has no plan and nothing saved', () => {
    const out = suggestNext({ ...base, candidates: [place({ id: 'a', openTill: '2:00 AM' })] })
    expect(out).toHaveLength(0)
  })

  it('excludes already-visited and checked-in places', () => {
    const candidates = [place({ id: 'a', openTill: '2:00 AM' }), place({ id: 'b', openTill: '2:00 AM' })]
    const out = suggestNext({ ...base, candidates, saved: ['a', 'b'], visited: ['a'], checkedIn: ['b'] })
    expect(out).toHaveLength(0)
  })

  it('ranks a planned stop above a merely-saved far place', () => {
    const near = place({ id: 'near', lat: 22.5626, lng: 88.363, openTill: '2:00 AM' })
    const far = place({ id: 'far', lat: 22.62, lng: 88.42, openTill: '2:00 AM' })
    const out = suggestNext({
      ...base,
      candidates: [near, far],
      todayPlan: [{ placeId: 'near', time: '19:00', durationMin: 45 }],
      todayDay: 'saptami',
      saved: ['far'],
    })
    expect(out[0].place.id).toBe('near')
    expect(out[0].reason).toContain('saptami plan')
  })

  it('surfaces distance and open-till in the reason, honestly', () => {
    const p = place({ id: 'x', openTill: '11:30 PM' })
    const out = suggestNext({ ...base, candidates: [p], saved: ['x'] })
    expect(out[0].reason).toMatch(/m|km/) // a distance is always quoted
    expect(out[0].reason).toContain('open till 11:30 PM')
  })

  it('does not claim a place is open when it has no posted hours', () => {
    const p = place({ id: 'nohours' })
    const out = suggestNext({ ...base, candidates: [p], saved: ['nohours'] })
    expect(out[0].reason).not.toContain('open till')
  })

  it('lets a "tonight" intent outrank a plain save at equal distance', () => {
    const a = place({ id: 'a', openTill: '2:00 AM' })
    const b = place({ id: 'b', openTill: '2:00 AM' })
    const out = suggestNext({
      ...base,
      candidates: [a, b],
      saved: ['a', 'b'],
      saveIntents: { a: 'visit-later', b: 'tonight' },
    })
    expect(out[0].place.id).toBe('b')
    expect(out[0].reason).toContain('saved for tonight')
  })

  it('caps the list at the requested limit', () => {
    const many = Array.from({ length: 6 }, (_, i) => place({ id: 'p' + i, openTill: '2:00 AM' }))
    const out = suggestNext({ ...base, candidates: many, saved: many.map((m) => m.id) }, 3)
    expect(out).toHaveLength(3)
  })
})
