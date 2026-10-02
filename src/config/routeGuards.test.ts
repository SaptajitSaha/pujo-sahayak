import { describe, it, expect } from 'vitest'
import { ROUTE_FLAGS, isRouteEnabled, routeFlag } from './routeGuards'
import { DEFAULT_FLAGS, type FeatureFlag } from './features'

// The README and the Settings screen both promise that disabling a feature
// "hides its UI and blocks its route". These tests pin the route half of that
// promise against the flag map — the surfaces that used to stay reachable via
// a typed URL or a stale deep link.

const allOn = (extra: Partial<Record<FeatureFlag, boolean>> = {}) => ({ ...DEFAULT_FLAGS, ...extra })

describe('routeFlag', () => {
  it('maps every flagged surface to its flag', () => {
    expect(routeFlag('/social')).toBe('ENABLE_SOCIAL_MATCHING')
    expect(routeFlag('/marketplace')).toBe('ENABLE_MARKETPLACE')
    expect(routeFlag('/premium')).toBe('ENABLE_PREMIUM')
    expect(routeFlag('/transport/metro/map')).toBe('ENABLE_METRO_MAP')
    expect(routeFlag('/passport')).toBe('ENABLE_PUJA_PASSPORT')
    expect(routeFlag('/diary')).toBe('ENABLE_PUJA_DIARY')
  })

  it('leaves core pages ungated', () => {
    for (const path of ['/', '/explore', '/profile', '/safety', '/maya', '/transport/metro']) {
      expect(routeFlag(path)).toBeNull()
    }
  })

  it('names only flags that actually exist in the flag union', () => {
    const known = new Set(Object.keys(DEFAULT_FLAGS) as FeatureFlag[])
    for (const flag of Object.values(ROUTE_FLAGS)) {
      expect(known.has(flag)).toBe(true)
    }
  })
})

describe('isRouteEnabled', () => {
  it('blocks a flagged route when its flag is off', () => {
    expect(isRouteEnabled(allOn({ ENABLE_MARKETPLACE: false }), '/marketplace')).toBe(false)
    expect(isRouteEnabled(allOn({ ENABLE_PREMIUM: false }), '/premium')).toBe(false)
  })

  it('allows the same route when the flag is on', () => {
    expect(isRouteEnabled(allOn({ ENABLE_MARKETPLACE: true }), '/marketplace')).toBe(true)
  })

  it('never blocks an ungated route, whatever the flags say', () => {
    const off = Object.fromEntries(
      (Object.keys(DEFAULT_FLAGS) as FeatureFlag[]).map((f) => [f, false]),
    ) as Record<FeatureFlag, boolean>
    expect(isRouteEnabled(off, '/')).toBe(true)
    expect(isRouteEnabled(off, '/profile/settings')).toBe(true)
  })
})
