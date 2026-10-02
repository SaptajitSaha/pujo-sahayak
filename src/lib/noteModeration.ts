// ─── Live-note moderation helpers (pure) ─────────────────────────────────────
// The client side of the moderation pipeline defined in
// supabase/migrations/002_moderation_and_commerce_boundaries.sql. Kept free of
// Supabase/React imports so the rules that caused real bugs — clients
// self-publishing as 'approved', notes hiding the pending state, text limits
// drifting from the DB CHECK — are unit-testable in this repo.

/** Mirrors the live_notes text CHECK (char_length(text) BETWEEN 1 AND 200). */
export const MAX_NOTE_TEXT = 200

/** The states the pipeline can hold. 'pending' is what a new client post gets;
 *  only the scheduled moderation pass publishes a note as 'approved'. */
export type NoteModerationStatus = 'pending' | 'approved' | 'rejected' | 'expired'

export interface NewNotePayload {
  place_id: string
  author_id: string
  text: string
  moderation_status: NoteModerationStatus
}

/**
 * Build the insert payload for a community note. The status is always
 * 'pending' — never 'approved' — so a client can never publish itself; text is
 * trimmed to match what the DB stores. Throws on input the DB would reject, so
 * the UI fails locally and honestly instead of on a network round trip.
 */
export function buildNewNotePayload(placeId: string, authorId: string, text: string): NewNotePayload {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Write something before sharing an update.')
  if (trimmed.length > MAX_NOTE_TEXT) throw new Error(`Keep it under ${MAX_NOTE_TEXT} characters.`)
  return { place_id: placeId, author_id: authorId, text: trimmed, moderation_status: 'pending' }
}

/**
 * i18n key for the honest status chip a note carries, or null when the note is
 * published (approved needs no label — being visible is its label). 'expired'
 * never renders in the feed because the query filters live notes, so it is not
 * mapped.
 */
export function noteStatusKey(status: NoteModerationStatus): 'notesPending' | 'notesRejected' | null {
  if (status === 'pending') return 'notesPending'
  if (status === 'rejected') return 'notesRejected'
  return null
}
