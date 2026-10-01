import { describe, expect, it } from 'vitest'
import { BAND_COST_FOR_TWO, costForTwo, formatInr } from './price'
import type { Place } from '../data/types'

/**
 * The cost shown on a restaurant card is DERIVED from the seeded `priceBand` —
 * the only price signal the dataset actually carries. These tests pin that
 * derivation so a card can never silently start asserting an invented number.
 */
const rest = (over: Partial<Place>): Place =>
  ({ id: 'r', type: 'restaurant', name: 'R', facilities: [], palette: { from: '#000', to: '#111' }, ...over }) as Place

describe('costForTwo', () => {
  it('converts each price band into an approximate rupee figure for two', () => {
    expect(costForTwo(rest({ priceBand: '₹' }))).toBe(200)
    expect(costForTwo(rest({ priceBand: '₹₹' }))).toBe(600)
    expect(costForTwo(rest({ priceBand: '₹₹₹' }))).toBe(1200)
  })

  it('stays in step with the exported band table', () => {
    for (const [band, value] of Object.entries(BAND_COST_FOR_TWO)) {
      expect(costForTwo(rest({ priceBand: band as Place['priceBand'] }))).toBe(value)
    }
  })

  it('returns null for a place with no band on record — no band, no claim', () => {
    expect(costForTwo(rest({}))).toBeNull()
    expect(costForTwo(rest({ priceBand: undefined }))).toBeNull()
  })

  it('returns null for pandals, which have no meal price at all', () => {
    expect(costForTwo(rest({ type: 'pandal', priceBand: '₹₹' }))).toBeNull()
  })

  it('accepts the narrow shape a card actually holds', () => {
    expect(costForTwo({ type: 'restaurant', priceBand: '₹₹' })).toBe(600)
  })
})

describe('formatInr', () => {
  it('prefixes the rupee sign and groups Indian-style', () => {
    expect(formatInr(200)).toBe('₹200')
    expect(formatInr(1200)).toBe('₹1,200')
    expect(formatInr(150000)).toBe('₹1,50,000')
  })
})
