import { describe, it, expect } from 'vitest'
import { MAX_NOTE_TEXT, buildNewNotePayload, noteStatusKey } from './noteModeration'

// Guards the moderation regressions the 2026-10 review found: clients used to
// insert notes as 'approved', publishing themselves past the pipeline, and the
// text limit was duplicated (and nearly diverged) between UI and DB.

describe('buildNewNotePayload', () => {
  it('always enters the pipeline as pending — a client can never self-publish', () => {
    const payload = buildNewNotePayload('pandal-baghbazar', 'user-1', 'Crowd is heavy at the north gate')
    expect(payload.moderation_status).toBe('pending')
  })

  it('trims surrounding whitespace before storing', () => {
    const payload = buildNewNotePayload('pandal-santosh-mitra', 'user-1', '  Queue moved  ')
    expect(payload.text).toBe('Queue moved')
  })

  it('rejects blank notes instead of round-tripping a DB CHECK failure', () => {
    expect(() => buildNewNotePayload('x', 'user-1', '   ')).toThrow()
  })

  it('accepts exactly the DB limit and rejects one over it', () => {
    expect(buildNewNotePayload('x', 'user-1', 'a'.repeat(MAX_NOTE_TEXT)).text.length).toBe(MAX_NOTE_TEXT)
    expect(() => buildNewNotePayload('x', 'user-1', 'a'.repeat(MAX_NOTE_TEXT + 1))).toThrow(
      /200 characters/,
    )
  })
})

describe('noteStatusKey', () => {
  it('labels pending and rejected notes honestly', () => {
    expect(noteStatusKey('pending')).toBe('notesPending')
    expect(noteStatusKey('rejected')).toBe('notesRejected')
  })

  it('renders no chip for published notes', () => {
    expect(noteStatusKey('approved')).toBeNull()
    expect(noteStatusKey('expired')).toBeNull()
  })
})
