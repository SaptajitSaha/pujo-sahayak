import { describe, it, expect } from 'vitest'
import { DEFAULT_FLAGS } from './config/features'

// Pure regression test for the persist migration — the real cause of the
// "Premium never shows up on existing installs" bug: zustand persist
// shallow-merges top-level state, so a stored featureFlags record is replaced
// wholesale and never gains flags added to DEFAULT_FLAGS afterwards. Bumping the
// version re-runs migrateState, which re-applies the { ...DEFAULT, ...stored }
// merge. Store lives under a DOM-less (node) test env, so stub the minimal
// localStorage zustand reads at import time, then dynamically import.
const mem = new Map<string, string>()
;(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
  setItem: (k: string, v: string) => { mem.set(k, v) },
  removeItem: (k: string) => { mem.delete(k) },
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
}
const { migrateState } = await import('./store')

describe('migrateState — featureFlags re-merge (persist v6)', () => {
  it('adds a flag that is missing from an older persisted record', () => {
    const stored = { featureFlags: { ENABLE_LIVE_NOTES: true } }
    const out = migrateState(stored, 5)
    // Newly-added flags (default ON) must appear even though the record predates them.
    expect(out.featureFlags.ENABLE_PREMIUM).toBe(true)
    expect(out.featureFlags.ENABLE_METRO_MAP).toBe(true)
  })

  it('preserves a user override on a flag that already exists in the record', () => {
    // The stored false must beat the true default — re-merge is not a reset.
    const stored = { featureFlags: { ENABLE_PREMIUM: false } }
    const out = migrateState(stored, 5)
    expect(out.featureFlags.ENABLE_PREMIUM).toBe(false)
  })

  it('yields a record containing every current default flag', () => {
    const out = migrateState({ featureFlags: {} }, 5)
    for (const key of Object.keys(DEFAULT_FLAGS)) {
      expect(out.featureFlags).toHaveProperty(key)
    }
  })
})
