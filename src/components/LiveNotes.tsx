// ─── Live Notes section ──────────────────────────────────────────────────────
// "Live from visitors" — community-reported observations on a place page.
// Trust-hierarchy: muted grey left-border + "Visitor" chip (distinct from
// Official notices which use gold + shield).
//
// All data comes from Supabase via useLiveNotes. When Supabase is unavailable,
// the section shows "No updates yet" — no fake data. New posts enter the
// moderation queue as 'pending' and render with an honest "Awaiting
// moderation" chip until the scheduled pass publishes them.

import { useState } from 'react'
import { Flag, MessageCircle, Send, ThumbsUp } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useApp } from '../store'
import { useT } from '../i18n'
import { QueryError } from './ui'
import { noteStatusKey, MAX_NOTE_TEXT } from '../lib/noteModeration'
import {
  useLiveNotes,
  useLiveNotesSubscription,
  usePostLiveNote,
  useMarkHelpful,
  useReportLiveNote,
  liveNotesBackendReady,
  relativeTime,
} from '../services/liveNotes'

interface Props {
  placeId: string
}

export function LiveNotes({ placeId }: Props) {
  const t = useT()
  const { isAuthenticated } = useAuth()
  const flags = useApp((s) => s.featureFlags)
  const addReport = useApp((s) => s.addReport)
  const [reported, setReported] = useState<Record<string, boolean>>({})
  // Honest per-note failure flags — a failed backend write never shows as sent.
  const [reportFailed, setReportFailed] = useState<Record<string, boolean>>({})
  const [helpfulFailed, setHelpfulFailed] = useState<Record<string, boolean>>({})
  const reportNoteLive = useReportLiveNote(placeId)

  const reportNote = (id: string) => {
    if (reported[id]) return
    // The local queue always records the report (works offline, no backend).
    addReport({ target_type: 'live_note', target_id: id, reason: 'live_note' })
    setReported((r) => ({ ...r, [id]: true }))
    if (liveNotesBackendReady && isAuthenticated) {
      reportNoteLive.mutate(
        { noteId: id, reason: 'live_note' },
        { onError: () => setReportFailed((f) => ({ ...f, [id]: true })) },
      )
    }
  }

  const markHelpful = useMarkHelpful(placeId)
  const helpful = (id: string) => {
    markHelpful.mutate(id, { onError: () => setHelpfulFailed((f) => ({ ...f, [id]: true })) })
  }

  const { data: notes = [], isLoading, isError, refetch } = useLiveNotes(placeId)
  useLiveNotesSubscription(placeId)
  const postNote = usePostLiveNote(placeId)

  const [composing, setComposing] = useState(false)
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > MAX_NOTE_TEXT) return
    postNote.mutate(text, { onSuccess: () => { setText(''); setComposing(false) } })
  }

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('notesTitle')}</h2>
        <span className="text-[10px] text-faint">{t('notesUnofficial')}</span>
      </div>

      {isLoading ? (
        <div className="mt-3 h-5 w-full animate-pulse rounded bg-ivory-deep" />
      ) : isError ? (
        <QueryError onRetry={() => refetch()} message={t('notesLoadFailed')} />
      ) : notes.length === 0 && !composing ? (
        <p className="mt-2 text-xs text-ink-soft">{t('notesEmpty')}</p>
      ) : (
        <div className="mt-2.5 space-y-2">
          {notes.map((note) => {
            const statusKey = noteStatusKey(note.moderation_status)
            return (
              <div
                key={note.id}
                className="relative rounded-lg border-l-[3px] border-l-gray-300 dark:border-l-gray-600 bg-card p-2.5 shadow-sm"
              >
                <p className="text-[13px] leading-snug text-ink">{note.text}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] text-faint">
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 font-medium text-gray-600 dark:text-gray-400">
                      {t('notesVisitor')}
                    </span>
                    {/* Honest state for the author's own queued/rejected note. */}
                    {statusKey && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {t(statusKey)}
                      </span>
                    )}
                    {relativeTime(note.created_at)}
                  </span>
                  {note.helpful_count > 0 && (
                    <span className="text-[10px] text-faint">{note.helpful_count} {t('notesHelpful')}</span>
                  )}
                </div>
                {(reportFailed[note.id] || helpfulFailed[note.id]) && (
                  <p role="status" className="mt-1 text-[10px] text-vermilion">
                    {helpfulFailed[note.id] ? t('notesHelpfulFailed') : t('notesReportLocalOnly')}
                  </p>
                )}
                <button
                  onClick={() => helpful(note.id)}
                  className="absolute right-2 top-2 rounded-full p-1 text-faint hover:text-emerald-600 active:scale-90"
                  aria-label={t('notesMarkHelpful')}
                >
                  <ThumbsUp size={12} />
                </button>
                {flags.ENABLE_INFO_REPORTS && (
                  <button
                    onClick={() => reportNote(note.id)}
                    className={`absolute right-8 top-2 rounded-full p-1 active:scale-90 ${reported[note.id] ? 'text-vermilion' : 'text-faint hover:text-vermilion'}`}
                    aria-label={t('reportFlag')}
                    title={
                      reportFailed[note.id]
                        ? t('notesReportLocalOnly')
                        : reported[note.id]
                          ? t('reportSent')
                          : t('reportFlag')
                    }
                  >
                    <Flag size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Compose */}
      {composing ? (
        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('notesPlaceholder')}
            maxLength={MAX_NOTE_TEXT}
            rows={2}
            className="w-full rounded-lg border border-ink/10 bg-ivory-deep px-3 py-2 text-sm outline-none focus:border-vermilion/50"
            autoFocus
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-faint">{text.length}/{MAX_NOTE_TEXT}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setComposing(false)} className="text-xs text-ink-soft">{t('reportCancel')}</button>
              <button
                type="submit"
                disabled={!text.trim() || postNote.isPending}
                className="flex items-center gap-1 rounded-full grad-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                <Send size={11} /> {postNote.isPending ? t('notesPosting') : t('notesShareBtn')}
              </button>
            </div>
          </div>
          {postNote.isError && <p className="mt-1 text-[10px] text-red-600">{(postNote.error as Error).message}</p>}
        </form>
      ) : (
        <button
          onClick={() => {
            if (!isAuthenticated) {
              // Prompt sign-in
              window.location.href = '/auth'
              return
            }
            setComposing(true)
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-ink/20 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-vermilion/40 hover:text-vermilion"
        >
          <MessageCircle size={13} /> {t('notesShareUpdate')}
        </button>
      )}
    </section>
  )
}
