import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isRouteEnabled } from '../config/routeGuards'
import { useApp } from '../store'

/**
 * Route-level feature gate. Renders children only while the flag governing
 * `path` is on (compile-time default merged with Settings → Developer runtime
 * overrides); a disabled feature redirects home instead of rendering — so the
 * README's "flags block their routes" promise holds for typed URLs and stale
 * deep links, not just hidden entry-point buttons.
 */
export function FeatureGate({ path, children }: { path: string; children: ReactNode }) {
  const featureFlags = useApp((s) => s.featureFlags)
  if (!isRouteEnabled(featureFlags, path)) return <Navigate to="/" replace />
  return <>{children}</>
}
