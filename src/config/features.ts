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
  // Second Product Extension (2026-09) — one flag per new surface.
  | 'ENABLE_BEST_TIME'
  | 'ENABLE_TONIGHT'
  | 'ENABLE_WHAT_NEXT'
  | 'ENABLE_SAFETY_CIRCLE'
  | 'ENABLE_SMART_MEETING'
  | 'ENABLE_STORY_MODE'
  | 'ENABLE_LOOK_CLOSER'
  | 'ENABLE_PANDAL_HISTORY'
  | 'ENABLE_ACCESSIBILITY'
  | 'ENABLE_PHOTO_GUIDE'
  | 'ENABLE_SAVE_INTENT'
  | 'ENABLE_PUJA_MODE'
  | 'ENABLE_PUJA_PASSPORT'
  | 'ENABLE_PUJA_DIARY'
  | 'ENABLE_PUJA_STATS'
  | 'ENABLE_PUJA_RECAP'
  | 'ENABLE_FESTIVAL_NOTICES'
  | 'ENABLE_INFO_REPORTS'
  // Animated full-network Kolkata Metro map on the Metro guide (2026-10).
  | 'ENABLE_METRO_MAP'

/** Compile-time defaults read from .env.local at build time. */
export const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  ENABLE_LIVE_NOTES: import.meta.env.VITE_FLAG_LIVE_NOTES !== 'false',
  ENABLE_SOCIAL_MATCHING: import.meta.env.VITE_FLAG_SOCIAL !== 'false',
  ENABLE_MARKETPLACE: import.meta.env.VITE_FLAG_MARKETPLACE === 'true',
  ENABLE_WALLET: import.meta.env.VITE_FLAG_WALLET === 'true',
  ENABLE_AUTHORITY_INTEGRATION: import.meta.env.VITE_FLAG_AUTHORITY !== 'false',
  // Extension features default ON in the demo build so the whole layer is
  // reviewable; each can be switched off per-install in Settings → Developer
  // or at build time with VITE_FLAG_<NAME>=false.
  ENABLE_BEST_TIME: import.meta.env.VITE_FLAG_BEST_TIME !== 'false',
  ENABLE_TONIGHT: import.meta.env.VITE_FLAG_TONIGHT !== 'false',
  ENABLE_WHAT_NEXT: import.meta.env.VITE_FLAG_WHAT_NEXT !== 'false',
  ENABLE_SAFETY_CIRCLE: import.meta.env.VITE_FLAG_SAFETY_CIRCLE !== 'false',
  ENABLE_SMART_MEETING: import.meta.env.VITE_FLAG_SMART_MEETING !== 'false',
  ENABLE_STORY_MODE: import.meta.env.VITE_FLAG_STORY_MODE !== 'false',
  ENABLE_LOOK_CLOSER: import.meta.env.VITE_FLAG_LOOK_CLOSER !== 'false',
  ENABLE_PANDAL_HISTORY: import.meta.env.VITE_FLAG_PANDAL_HISTORY !== 'false',
  ENABLE_ACCESSIBILITY: import.meta.env.VITE_FLAG_ACCESSIBILITY !== 'false',
  ENABLE_PHOTO_GUIDE: import.meta.env.VITE_FLAG_PHOTO_GUIDE !== 'false',
  ENABLE_SAVE_INTENT: import.meta.env.VITE_FLAG_SAVE_INTENT !== 'false',
  ENABLE_PUJA_MODE: import.meta.env.VITE_FLAG_PUJA_MODE !== 'false',
  ENABLE_PUJA_PASSPORT: import.meta.env.VITE_FLAG_PUJA_PASSPORT !== 'false',
  ENABLE_PUJA_DIARY: import.meta.env.VITE_FLAG_PUJA_DIARY !== 'false',
  ENABLE_PUJA_STATS: import.meta.env.VITE_FLAG_PUJA_STATS !== 'false',
  ENABLE_PUJA_RECAP: import.meta.env.VITE_FLAG_PUJA_RECAP !== 'false',
  ENABLE_FESTIVAL_NOTICES: import.meta.env.VITE_FLAG_FESTIVAL_NOTICES !== 'false',
  ENABLE_INFO_REPORTS: import.meta.env.VITE_FLAG_INFO_REPORTS !== 'false',
  ENABLE_METRO_MAP: import.meta.env.VITE_FLAG_METRO_MAP !== 'false',
}

/** Runtime flag state — merged from defaults + user overrides (via Zustand). */
export interface FlagOverrides {
  featureFlags: Record<FeatureFlag, boolean>
  setFeatureFlag: (flag: FeatureFlag, value: boolean) => void
}
