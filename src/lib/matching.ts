// ─── Social matching: pure logic (TDD target) ────────────────────────────────
// Transparent, explainable scoring — no black box.
// Score = interestOverlap×3 + sharedArea×2 + sharedTithi×2 + compatibleStyle×1

import type { SocialPreference, MatchCard } from '../data/types'

/** Count overlap between two string arrays (case-insensitive). */
function overlap(a: string[], b: string[]): number {
  const setB = new Set(b.map((x) => x.toLowerCase()))
  return a.filter((x) => setB.has(x.toLowerCase())).length
}

/** Compute a transparent match score (0–8 range). */
export function computeMatchScore(mine: SocialPreference, theirs: SocialPreference): number {
  const interestPts = overlap(mine.interests, theirs.interests) * 3
  const areaPts = overlap(mine.preferred_areas, theirs.preferred_areas) > 0 ? 2 : 0
  const tithiPts = mine.planned_tithi && theirs.planned_tithi && mine.planned_tithi === theirs.planned_tithi ? 2 : 0
  const stylePts = mine.outing_style === theirs.outing_style ? 1 : 0
  return interestPts + areaPts + tithiPts + stylePts
}

/** Filter + rank a list of preferences into match cards above threshold. */
export function filterMatches(
  others: SocialPreference[],
  mine: SocialPreference,
  threshold = 3,
  blockedIds: string[] = [],
): MatchCard[] {
  return others
    .filter((o) => o.user_id !== mine.user_id && !blockedIds.includes(o.user_id))
    .map((o) => ({
      userId: o.user_id,
      displayName: o.display_name ?? 'Anonymous',
      interests: o.interests,
      plannedArea: o.preferred_areas[0] ?? 'Any area',
      plannedTithi: o.planned_tithi,
      matchScore: computeMatchScore(mine, o),
    }))
    .filter((m) => m.matchScore >= threshold)
    .sort((a, b) => b.matchScore - a.matchScore)
}
