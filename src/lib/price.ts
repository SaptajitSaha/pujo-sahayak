// Approximate meal cost for two — the price signal a directory card shows.
//
// Honesty rule (doc §58, same convention as lib/pulse.ts): a restaurant in this
// dataset carries `priceBand` ('₹' … '₹₹₹') and nothing finer. So the rupee
// figure is DERIVED from that band as a documented mid-range estimate, and every
// surface renders it behind an "≈" so it never reads as a posted menu price.
// No per-restaurant number is invented anywhere.

import type { Place } from '../data/types'

type PriceBand = NonNullable<Place['priceBand']>

/**
 * Band → what two people would roughly spend à la carte at a Kolkata eatery in
 * that band. Rounded, deliberately coarse figures — the band is coarse too, and
 * a precise-looking number derived from a fuzzy input would be a false promise.
 */
export const BAND_COST_FOR_TWO: Record<PriceBand, number> = {
  '₹': 200,
  '₹₹': 600,
  '₹₹₹': 1200,
}

/**
 * The approximate cost for two, or null when there is nothing to base it on.
 * Pandals have no meal price, so they never get a figure. Takes the narrow
 * shape a card already has in hand rather than a whole Place.
 */
export function costForTwo(
  place: Pick<Place, 'type' | 'priceBand'>,
): number | null {
  if (place.type !== 'restaurant' || !place.priceBand) return null
  return BAND_COST_FOR_TWO[place.priceBand] ?? null
}

/** ₹ with Indian digit grouping — 1200 → "₹1,200". */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
