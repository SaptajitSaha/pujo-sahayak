// ─── Authority Integration Service ───────────────────────────────────────────
// Official notices + alerts from registered authority providers.
// When no real provider is active, uses clearly-labeled demo seed data.
// Architecture: provider adapters — swap mock for real API integrations later.

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { OfficialNotice, AuthorityAlert, AuthorityProvider } from '../data/types'

// ─── Demo seed (clearly labeled, no fabricated live data) ────────────────────
const DEMO_NOTICES: OfficialNotice[] = [
  {
    id: 'notice-demo-1', place_id: 'pandal-santosh-mitra',
    source: 'Pandal Operations (DEMO)', text: 'Main entrance temporarily closed. Use Gate 2.',
    created_at: new Date(Date.now() - 18 * 60_000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 60_000).toISOString(),
    expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
    verification_status: 'official',
  },
  {
    id: 'notice-demo-2', place_id: 'pandal-baghbazar',
    source: 'Traffic Police (DEMO)', text: 'Road closure near Baghbazar from 6 PM to midnight. Use alternate routes via Circular Road.',
    created_at: new Date(Date.now() - 45 * 60_000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60_000).toISOString(),
    expires_at: new Date(Date.now() + 4 * 3600_000).toISOString(),
    verification_status: 'official',
  },
]

const DEMO_PROVIDERS: AuthorityProvider[] = [
  { id: 'prov-1', name: 'Kolkata Police (Demo)', provider_type: 'police', api_url: null, is_active: false, created_at: '' },
  { id: 'prov-2', name: 'Pandal Operations (Demo)', provider_type: 'pandal_ops', api_url: null, is_active: false, created_at: '' },
]

// ─── Query hooks ─────────────────────────────────────────────────────────────

/** Plain (non-hook) fetcher — used by Maya's async orchestrator outside React. */
export async function fetchOfficialNotices(placeId: string): Promise<OfficialNotice[]> {
  if (!supabase) return DEMO_NOTICES.filter((n) => n.place_id === placeId)
  const { data, error } = await supabase
    .from('official_notices').select('*').eq('place_id', placeId)
    .order('created_at', { ascending: false }).limit(5)
  if (error) throw error
  const notices = (data ?? []) as OfficialNotice[]
  return notices.length ? notices : DEMO_NOTICES.filter((n) => n.place_id === placeId)
}

export function useOfficialNotices(placeId: string) {
  return useQuery<OfficialNotice[]>({
    queryKey: ['official-notices', placeId],
    queryFn: async () => {
      if (!supabase) {
        // No backend — return demo data clearly labeled
        return DEMO_NOTICES.filter((n) => n.place_id === placeId)
      }
      const { data, error } = await supabase
        .from('official_notices')
        .select('*')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      const notices = (data ?? []) as OfficialNotice[]
      // If no real notices exist, fall back to demo for this place
      if (notices.length === 0) return DEMO_NOTICES.filter((n) => n.place_id === placeId)
      return notices
    },
  })
}

/** Notices across a set of places (the Home festival digest). Without a backend
    this returns the clearly-labeled demo notices whose place_id is in the set;
    with one it queries `official_notices` filtered to those places. Falls back
    to demo only when the real query returns nothing. */
export function useCityNotices(placeIds: string[]) {
  return useQuery<OfficialNotice[]>({
    queryKey: ['city-notices', placeIds.join(',')],
    enabled: placeIds.length > 0,
    queryFn: async () => {
      if (!supabase) return DEMO_NOTICES.filter((n) => placeIds.includes(n.place_id))
      const { data, error } = await supabase
        .from('official_notices').select('*').in('place_id', placeIds)
        .order('created_at', { ascending: false }).limit(30)
      if (error) throw error
      const notices = (data ?? []) as OfficialNotice[]
      return notices.length ? notices : DEMO_NOTICES.filter((n) => placeIds.includes(n.place_id))
    },
  })
}

export function useAuthorityAlerts(placeId?: string) {
  return useQuery<AuthorityAlert[]>({
    queryKey: ['authority-alerts', placeId ?? 'all'],
    queryFn: async () => {
      if (!supabase) return []
      let query = supabase.from('authority_alerts').select('*').order('created_at', { ascending: false }).limit(20)
      if (placeId) query = query.eq('place_id', placeId)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as AuthorityAlert[]
    },
  })
}

export function useAuthorityProviders() {
  return useQuery<AuthorityProvider[]>({
    queryKey: ['authority-providers'],
    queryFn: async () => {
      if (!supabase) return DEMO_PROVIDERS
      const { data, error } = await supabase.from('authority_providers').select('*').order('name')
      if (error) throw error
      const providers = (data ?? []) as AuthorityProvider[]
      return providers.length > 0 ? providers : DEMO_PROVIDERS
    },
  })
}

/** Subscribe to real-time notices for a place. */
export function useNoticesSubscription(placeId: string) {
  const ref = useRef<{ unsubscribe: () => void } | null>(null)
  useEffect(() => {
    if (!supabase || !placeId) return
    const channel = supabase
      .channel(`notices-${placeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'official_notices', filter: `place_id=eq.${placeId}` }, () => {})
      .subscribe()
    ref.current = channel
    return () => { channel.unsubscribe() }
  }, [placeId])
}

/** Check if a notice is stale (past expiry). */
export function isStale(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}
