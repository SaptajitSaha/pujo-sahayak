// ─── Live Notes service ──────────────────────────────────────────────────────
// TanStack Query hooks + Supabase Realtime subscription for community notes.
// When Supabase is not configured, falls back to an empty mock (no fake data).
//
// Moderation pipeline (see supabase/migrations/002_*.sql): client posts always
// enter as 'pending' and only the scheduled moderation pass publishes them.
// Reporting and helpful counts go through atomic SECURITY DEFINER RPCs — every
// backend error is checked and rethrown so the UI never claims success on a
// failed write.

import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/auth'
import { buildNewNotePayload } from '../lib/noteModeration'
import type { LiveNote } from '../data/types'

const KEY_PREFIX = ['live-notes']

/** Whether the note backend (Supabase) is configured — the UI uses this to
    choose "report to the server" vs "keep the honest local log". */
export const liveNotesBackendReady = !!supabase

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

/**
 * Feed for a place: live approved notes for everyone, plus the signed-in
 * author's own pending notes (RLS restricts 'pending' rows to their author),
 * so a fresh post shows back with an honest "Awaiting moderation" chip instead
 * of vanishing.
 */
export function useLiveNotes(placeId: string) {
  return useQuery<LiveNote[]>({
    queryKey: [...KEY_PREFIX, placeId],
    queryFn: async () => {
      if (!supabase) return [] // no backend, no data
      const iso = new Date().toISOString()
      const { data, error } = await supabase
        .from('live_notes')
        .select('*')
        .eq('place_id', placeId)
        // PostgREST needs the timestamp quoted inside or() — it contains ':'
        // and '.', which otherwise break the filter parser.
        .or(`and(moderation_status.eq.approved,expires_at.gt."${iso}"),moderation_status.eq.pending`)
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

/** Post a new live note (requires auth). Enters the moderation queue. */
export function usePostLiveNote(placeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (text: string) => {
      if (!supabase) throw new Error('Not connected')
      const userId = await getUserId()
      if (!userId) throw new Error('Sign in to post updates')
      // buildNewNotePayload always yields 'pending' — clients cannot publish
      // themselves; the moderation pass does that.
      const { data, error } = await supabase
        .from('live_notes')
        .insert(buildNewNotePayload(placeId, userId, text))
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

/**
 * Report a note. One atomic RPC inserts the report AND bumps reported_count
 * server-side (idempotent per reporter). Returns whether the report was new;
 * throws on any backend failure so the caller can be honest about it.
 */
export function useReportLiveNote(placeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ noteId, reason }: { noteId: string; reason: string }) => {
      if (!supabase) throw new Error('Not connected')
      const userId = await getUserId()
      if (!userId) throw new Error('Sign in to report updates')
      const { data, error } = await supabase.rpc('report_live_note', {
        p_note_id: noteId,
        p_reason: reason,
      })
      if (error) throw error
      return data as boolean
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY_PREFIX, placeId] }),
  })
}

/** Mark a note as helpful — atomic server-side increment (no read-modify race). */
export function useMarkHelpful(placeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!supabase) throw new Error('Not connected')
      const { error } = await supabase.rpc('increment_note_helpful', { p_note_id: noteId })
      if (error) throw error
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
