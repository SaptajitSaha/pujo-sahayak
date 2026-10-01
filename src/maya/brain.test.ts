import { describe, expect, it } from 'vitest'
import { answer, type UserActivity } from './brain'
import { pandals } from '../data/demo'
import type { Checkin } from '../lib/scorecard'

// A pandal that genuinely exists in the demo dataset, so suggestNext / placeById
// resolve real records (the honesty contract under test).
const p = pandals[0]

const baseActivity = (over: Partial<UserActivity> = {}): UserActivity => ({
  now: new Date('2026-10-06T19:30:00'),
  user: { lat: p.lat, lng: p.lng },
  candidates: pandals,
  todayPlan: [], todayDay: 'ashtami',
  saved: [p.id], saveIntents: {}, visited: [], checkedIn: [],
  checkins: [], diary: [],
  ...over,
})

const checkin = (placeId: string, ts: number, tithi: Checkin['tithi']): Checkin => ({
  placeId, tithi, ts, lat: p.lat, lng: p.lng, accuracyM: 20,
})

describe("Maya · activity-grounded intents", () => {
  it('answers "what should I do next" from the user\'s real saves', () => {
    const reply = answer('what should I do next?', null, null, baseActivity())
    expect(reply.text).toContain(p.name)
    expect(reply.text).toMatch(/From your plan and saves/i)
  })

  it('does NOT invent a next-step when nothing is saved or planned', () => {
    const reply = answer('what should I do next?', null, null, baseActivity({ saved: [], checkedIn: [] }))
    // Falls past the activity branch to the generic planning answer, which
    // offers a sample evening rather than a fabricated personalised pick.
    expect(reply.text).not.toMatch(/From your plan and saves/i)
  })

  it('honestly declines a recap when there are no check-ins', () => {
    const reply = answer('summarize my puja so far', null, null, baseActivity())
    expect(reply.text).toMatch(/no check-ins/i)
  })

  it('summarises real counts when check-ins exist', () => {
    const activity = baseActivity({ checkins: [checkin(p.id, Date.now(), 'ashtami')] })
    const reply = answer('summarize my puja', null, null, activity)
    expect(reply.text).toMatch(/So far:/)
    expect(reply.text).toContain('1 pandal')
  })

  it('gives a modelled best-time window for the context pandal', () => {
    const reply = answer('when is the best time to visit?', p, null, baseActivity())
    expect(reply.text).toMatch(/Quietest at/)
    expect(reply.text).toMatch(/modelled estimate/i)
  })
})
