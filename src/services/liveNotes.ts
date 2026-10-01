// ─── Live Notes service ──────────────────────────────────────────────────────
// TanStack Query hooks + Supabase Realtime subscription for community notes.
// When Supabase is not configured, falls back to an empty mock (no fake data).

import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/auth'
import type { LiveNote } from '../data/types'

const KEY_PREFIX = ['live-notes']

/** Plain (non-hook) fetcher — used by Maya's async orchestrator outside React. */
export async function fetchLiveNotes(placeId: string): Promise<LiveNote[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('live_notes').select('*')
    .eq('place_id', placeId).eq('moderation_status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false }).limit(5)
  if (error) throw error
  return (data ?? []) as LiveNote[]
}

/** Fetch approved, non-expired notes for a place. */
export function useLiveNotes(placeId: string) {
  return useQuery<LiveNote[]>({
    queryKey: [...KEY_PREFIX, placeId],
    queryFn: async () => {
      if (!supabase) return [] // no backend, no data
      const { data, error } = await supabase
        .from('live_notes')
        .select('*')
        .eq('place_id', placeId)
        .eq('moderation_status', 'approved')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as LiveNote[]
    },
    enabled: !!supabase && !!placeId,
  })
}

/** Subscribe to real-time inserts/updates for a place's notes. */
export function useLiveNotesSubscription(placeId: string) {
  const qc = useQueryClient()
  const channelRef = useRef<{ unsubscribe: () => void } | null>(null)

  useEffect(() => {
    if (!supabase || !placeId) return
    const channel = supabase
      .channel(`live-notes-${placeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_notes', filter: `place_id=eq.${placeId}` },
        () => { qc.invalidateQueries({ queryKey: [...KEY_PREFIX, placeId] }) },
      )
      .subscribe()
    channelRef.current = channel
    return () => { channel.unsubscribe() }
  }, [placeId, qc])
}

/** Post a new live note (requires auth). */
export function usePostLiveNote(placeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (text: string) => {
      if (!supabase) throw new Error('Not connected')
      const userId = await getUserId()
      if (!userId) throw new Error('Sign in to post updates')
      const { data, error } = await supabase
        .from('live_notes')
        .insert({
          place_id: placeId,
          author_id: userId,
          text: text.trim(),
          moderation_status: 'approved', // auto-approve for MVP; edge function moderates later
        })
        .select()
        .single()
      if (error) throw error
      return data as LiveNote
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY_PREFIX, placeId] }),
  })
}

/** Delete own note. */
export function useDeleteLiveNote(placeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!supabase) throw new Error('Not connected')
      const { error } = await supabase.from('live_notes').delete().eq('id', noteId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY_PREFIX, placeId] }),
  })
}

/** Report a note (moderation signal). */
export function useReportLiveNote(placeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ noteId, reason }: { noteId: string; reason: string }) => {
      if (!supabase) throw new Error('Not connected')
      const userId = await getUserId()
      // Insert into user_reports
      await supabase.from('user_reports').insert({
        reporter_id: userId,
        target_type: 'live_note',
        target_id: noteId,
        reason,
      })
      // Increment reported_count
      await supabase.rpc('increment_note_reports', { note_id: noteId }).single()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY_PREFIX, placeId] }),
  })
}

/** Mark a note as helpful. */
export function useMarkHelpful(placeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!supabase) throw new Error('Not connected')
      // Simple increment via a read-modify-write (production uses a DB trigger)
      const { data } = await supabase.from('live_notes').select('helpful_count').eq('id', noteId).single()
      if (data) {
        await supabase.from('live_notes').update({ helpful_count: (data.helpful_count ?? 0) + 1 }).eq('id', noteId)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY_PREFIX, placeId] }),
  })
}

/** Format a relative timestamp ("6 min ago"). */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
