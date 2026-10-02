// ─── Social matching service ─────────────────────────────────────────────────
// TanStack Query hooks over the `social_preferences` table. When Supabase is
// not configured, reads fall back to an empty list — the app invents no people.
// Matching itself is pure logic in ../lib/matching (unit-tested).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/auth'
import { filterMatches } from '../lib/matching'
import type { MatchCard, SocialPreference } from '../data/types'

const KEY = ['social-prefs']

/** Current user's own preference profile (null when signed out / not set). */
export function useMyPreferences(userId: string | null) {
  return useQuery<SocialPreference | null>({
    queryKey: [...KEY, 'me', userId],
    queryFn: async () => {
      if (!supabase || !userId) return null
      const { data, error } = await supabase
        .from('social_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return (data as SocialPreference) ?? null
    },
    enabled: !!supabase && !!userId,
  })
}

/** Upsert the signed-in user's preferences. */
export function useUpdatePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (prefs: Omit<SocialPreference, 'user_id'>) => {
      if (!supabase) throw new Error('Not connected')
      const userId = await getUserId()
      if (!userId) throw new Error('Sign in to save preferences')
      const row = { ...prefs, user_id: userId }
      const { data, error } = await supabase
        .from('social_preferences')
        .upsert(row, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) throw error
      return data as SocialPreference
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: [...KEY, 'me', d.user_id] }),
  })
}

/**
 * Columns a match actually needs. `select('*')` shipped every stored field of
 * every public profile to whoever opened the page — including rows RLS lets them
 * see — so the query is narrowed to the inputs of filterMatches. RLS still
 * limits which rows appear; this limits what leaves the database.
 */
const PROFILE_FIELDS =
  'user_id, interests, preferred_areas, preferred_time, crowd_preference, outing_style, planned_tithi, display_name, visibility'

/**
 * Public, visible preference profiles of *other* users. RLS restricts this to
 * rows marked `visibility = 'public'`. Empty when Supabase is unavailable —
 * we never fabricate people to match against.
 */
export function useVisibleProfiles(excludeUserId: string | null) {
  return useQuery<SocialPreference[]>({
    queryKey: [...KEY, 'visible', excludeUserId ?? 'anon'],
    queryFn: async () => {
      if (!supabase) return []
      let query = supabase.from('social_preferences').select(PROFILE_FIELDS).eq('visibility', 'public')
      if (excludeUserId) query = query.neq('user_id', excludeUserId)
      const { data, error } = await query.limit(50)
      if (error) throw error
      return (data ?? []) as SocialPreference[]
    },
    enabled: !!supabase,
  })
}

/** Derive ranked match cards from the visible profiles + my preferences.
    Also surfaces the underlying query state so the UI can show loading/error. */
export function useMatches(
  myPrefs: SocialPreference | null,
  blockedIds: string[] = [],
  threshold = 3,
): { cards: MatchCard[]; isLoading: boolean; isError: boolean; refetch: () => void } {
  const { data: profiles = [], isLoading, isError, refetch } = useVisibleProfiles(myPrefs?.user_id ?? null)
  const cards = myPrefs ? filterMatches(profiles, myPrefs, threshold, blockedIds) : []
  return { cards, isLoading, isError, refetch }
}
