import { describe, expect, it } from 'vitest'
import { computeMatchScore, filterMatches } from './matching'
import type { SocialPreference } from '../data/types'

/** Build a preference with sensible defaults, overriding only what a test cares about. */
const pref = (o: Partial<SocialPreference> & { user_id: string }): SocialPreference => ({
  interests: [],
  preferred_areas: [],
  preferred_time: 'evening',
  crowd_preference: 'moderate',
  language_preference: 'en',
  outing_style: 'relaxed',
  planned_tithi: null,
  visibility: 'public',
  display_name: null,
  ...o,
})

describe('computeMatchScore', () => {
  it('scores each interest overlap at 3 points', () => {
    const mine = pref({ user_id: 'me', interests: ['Photography', 'Food'], outing_style: 'relaxed' })
    const theirs = pref({ user_id: 'a', interests: ['Photography'], outing_style: 'energetic' })
    // 1 shared interest × 3 = 3; area/tithi/style all differ
    expect(computeMatchScore(mine, theirs)).toBe(3)
  })

  it('is case-insensitive on interests', () => {
    const mine = pref({ user_id: 'me', interests: ['photography'], outing_style: 'relaxed' })
    const theirs = pref({ user_id: 'a', interests: ['Photography'], outing_style: 'energetic' })
    expect(computeMatchScore(mine, theirs)).toBe(3)
  })

  it('awards area, tithi and style bonuses independently', () => {
    const mine = pref({ user_id: 'me', interests: [], preferred_areas: ['Gariahat'], planned_tithi: 'ashtami', outing_style: 'relaxed' })
    const theirs = pref({ user_id: 'a', interests: [], preferred_areas: ['Gariahat'], planned_tithi: 'ashtami', outing_style: 'relaxed' })
    // area 2 + tithi 2 + style 1 = 5
    expect(computeMatchScore(mine, theirs)).toBe(5)
  })

  it('gives the full 8 for a complete match', () => {
    const mine = pref({ user_id: 'me', interests: ['Food'], preferred_areas: ['Gariahat'], planned_tithi: 'saptami', outing_style: 'energetic' })
    const theirs = pref({ user_id: 'a', interests: ['Food'], preferred_areas: ['Gariahat'], planned_tithi: 'saptami', outing_style: 'energetic' })
    expect(computeMatchScore(mine, theirs)).toBe(8)
  })

  it('scores zero for nothing in common', () => {
    const mine = pref({ user_id: 'me', interests: ['Art'], outing_style: 'relaxed' })
    const theirs = pref({ user_id: 'a', interests: ['Food'], outing_style: 'energetic' })
    expect(computeMatchScore(mine, theirs)).toBe(0)
  })
})

describe('filterMatches', () => {
  const mine = pref({ user_id: 'me', interests: ['Photography', 'Food'], preferred_areas: ['Gariahat'], planned_tithi: 'ashtami' })

  it('excludes the user themselves', () => {
    const others = [pref({ user_id: 'me', interests: ['Photography'] })]
    expect(filterMatches(others, mine)).toHaveLength(0)
  })

  it('drops matches below the threshold', () => {
    const others = [pref({ user_id: 'lo', interests: ['Music'] })] // score 0
    expect(filterMatches(others, mine, 3)).toHaveLength(0)
  })

  it('respects the blocked list', () => {
    const others = [pref({ user_id: 'a', interests: ['Photography', 'Food'] })] // score 6
    expect(filterMatches(others, mine, 3, ['a'])).toHaveLength(0)
    expect(filterMatches(others, mine, 3, [])).toHaveLength(1)
  })

  it('ranks by descending score', () => {
    const others = [
      pref({ user_id: 'weak', interests: ['Photography'] }),                 // 3
      pref({ user_id: 'strong', interests: ['Photography', 'Food'], preferred_areas: ['Gariahat'] }), // 3+3+2 = 8
    ]
    const res = filterMatches(others, mine, 3)
    expect(res.map((m) => m.userId)).toEqual(['strong', 'weak'])
  })

  it('never exposes an exact location — only the planned area label', () => {
    const others = [pref({ user_id: 'a', interests: ['Food'], preferred_areas: ['Gariahat'], planned_tithi: 'ashtami' })]
    const [card] = filterMatches(others, mine, 1)
    expect(card.plannedArea).toBe('Gariahat')
    expect(card).not.toHaveProperty('lat')
    expect(card).not.toHaveProperty('lng')
  })
})
