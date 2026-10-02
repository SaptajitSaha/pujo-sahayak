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

describe('migrateState — userMeetups default (persist v7)', () => {
  it('gives an older record the empty meetup list CreateMeetup now writes to', () => {
    const out = migrateState({ saved: ['pandal-baghbazar'] }, 6)
    expect(Array.isArray(out.userMeetups)).toBe(true)
    expect(out.userMeetups).toHaveLength(0)
  })

  it('keeps meetups the user already created, and existing flags overrides', () => {
    const mine = [{ id: 'um-1', title: 'T', date: '2026-10-12', time: '19:00', location: 'Gariahat', description: '', interests: [], maxParticipants: 8, visibility: 'public', palette: { from: '#000', to: '#111' }, createdAt: '2026-10-01T00:00:00.000Z' }]
    const out = migrateState({ userMeetups: mine, featureFlags: { ENABLE_PREMIUM: false } }, 6)
    expect(out.userMeetups).toHaveLength(1)
    expect(out.userMeetups[0].id).toBe('um-1')
    expect(out.featureFlags.ENABLE_PREMIUM).toBe(false)
  })

  it('repairs a record whose userMeetups is not an array', () => {
    const out = migrateState({ userMeetups: null }, 6)
    expect(out.userMeetups).toEqual([])
  })
})
