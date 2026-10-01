// ─── Feature flags ──────────────────────────────────────────────────────────
// Compile-time defaults from env vars; runtime overrides persisted in Zustand
// (Settings → Developer section). All new features gate their routes and UI
// sections behind these flags so they can be disabled independently.

export type FeatureFlag =
  | 'ENABLE_LIVE_NOTES'
  | 'ENABLE_SOCIAL_MATCHING'
  | 'ENABLE_MARKETPLACE'
  | 'ENABLE_WALLET'
  | 'ENABLE_AUTHORITY_INTEGRATION'

/** Compile-time defaults read from .env.local at build time. */
export const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  ENABLE_LIVE_NOTES: import.meta.env.VITE_FLAG_LIVE_NOTES !== 'false',
  ENABLE_SOCIAL_MATCHING: import.meta.env.VITE_FLAG_SOCIAL !== 'false',
  ENABLE_MARKETPLACE: import.meta.env.VITE_FLAG_MARKETPLACE === 'true',
  ENABLE_WALLET: import.meta.env.VITE_FLAG_WALLET === 'true',
  ENABLE_AUTHORITY_INTEGRATION: import.meta.env.VITE_FLAG_AUTHORITY !== 'false',
}

/** Runtime flag state — merged from defaults + user overrides (via Zustand). */
export interface FlagOverrides {
  featureFlags: Record<FeatureFlag, boolean>
  setFeatureFlag: (flag: FeatureFlag, value: boolean) => void
}
