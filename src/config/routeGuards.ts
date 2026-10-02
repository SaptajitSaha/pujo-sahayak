// ─── Route guards (pure) ─────────────────────────────────────────────────────
// Project rule (README + Settings copy): "Turning a flag off hides its UI and
// blocks its route." Until now the flag only hid entry points — the routes
// stayed mounted, so a typed or stale URL still opened a disabled feature.
// This map is the single source of truth: every route whose surface is gated by
// a feature flag lists it here, and FeatureGate (components/FeatureGate.tsx)
// refuses to render children when the runtime flag is off.

import type { FeatureFlag } from './features'

/** Route path → the flag that governs it. Routes not listed here are always
 *  public (discovery, planner, safety, profile, …). */
export const ROUTE_FLAGS = {
  '/social': 'ENABLE_SOCIAL_MATCHING',
  '/marketplace': 'ENABLE_MARKETPLACE',
  '/premium': 'ENABLE_PREMIUM',
  '/transport/metro/map': 'ENABLE_METRO_MAP',
  '/passport': 'ENABLE_PUJA_PASSPORT',
  '/diary': 'ENABLE_PUJA_DIARY',
} as const satisfies Record<string, FeatureFlag>

/** The flag governing a route, or null when the route is ungated. */
export function routeFlag(path: string): FeatureFlag | null {
  return (ROUTE_FLAGS as Record<string, FeatureFlag>)[path] ?? null
}

/** Whether a route may render for the current runtime flag state (defaults
 *  merged with Settings → Developer overrides — the persisted store object). */
export function isRouteEnabled(
  flags: Record<FeatureFlag, boolean>,
  path: string,
): boolean {
  const flag = routeFlag(path)
  return flag === null || flags[flag] === true
}
