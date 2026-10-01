// ─── Live Notes section ──────────────────────────────────────────────────────
// "Live from visitors" — community-reported observations on a place page.
// Trust-hierarchy: muted grey left-border + "Visitor" chip (distinct from
// Official notices which use gold + shield).
//
// All data comes from Supabase via useLiveNotes. When Supabase is unavailable,
// the section shows "No updates yet" — no fake data.

import { useState } from 'react'
import { MessageCircle, Send, ThumbsUp } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { QueryError } from './ui'
import {
  useLiveNotes,
  useLiveNotesSubscription,
  usePostLiveNote,
  useMarkHelpful,
  relativeTime,
} from '../services/liveNotes'

interface Props {
  placeId: string
}

export function LiveNotes({ placeId }: Props) {
  const { isAuthenticated } = useAuth()
  const { data: notes = [], isLoading, isError, refetch } = useLiveNotes(placeId)
  useLiveNotesSubscription(placeId)
  const postNote = usePostLiveNote(placeId)
  const markHelpful = useMarkHelpful(placeId)

  const [composing, setComposing] = useState(false)
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || text.trim().length > 200) return
    postNote.mutate(text, { onSuccess: () => { setText(''); setComposing(false) } })
  }

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Live from visitors</h2>
        <span className="text-[10px] text-faint">Not official — visitor-reported</span>
      </div>

      {isLoading ? (
        <div className="mt-3 h-5 w-full animate-pulse rounded bg-ivory-deep" />
      ) : isError ? (
        <QueryError onRetry={() => refetch()} message="Couldn’t load visitor updates." />
      ) : notes.length === 0 && !composing ? (
        <p className="mt-2 text-xs text-ink-soft">No updates yet. Be the first to share what's happening here.</p>
      ) : (
        <div className="mt-2.5 space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border-l-[3px] border-l-gray-300 dark:border-l-gray-600 bg-card p-2.5 shadow-sm"
            >
              <p className="text-[13px] leading-snug text-ink">{note.text}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] text-faint">
                  <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 font-medium text-gray-600 dark:text-gray-400">
                    Visitor
                  </span>
                  {relativeTime(note.created_at)}
                </span>
                {note.helpful_count > 0 && (
                  <span className="text-[10px] text-faint">{note.helpful_count} helpful</span>
                )}
              </div>
              <button
                onClick={() => markHelpful.mutate(note.id)}
                className="absolute right-2 top-2 rounded-full p-1 text-faint hover:text-emerald-600 active:scale-90"
                aria-label="Mark helpful"
              >
                <ThumbsUp size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Compose */}
      {composing ? (
        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening here? (max 200 chars)"
            maxLength={200}
            rows={2}
            className="w-full rounded-lg border border-ink/10 bg-ivory-deep px-3 py-2 text-sm outline-none focus:border-vermilion/50"
            autoFocus
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-faint">{text.length}/200</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setComposing(false)} className="text-xs text-ink-soft">Cancel</button>
              <button
                type="submit"
                disabled={!text.trim() || postNote.isPending}
                className="flex items-center gap-1 rounded-full grad-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                <Send size={11} /> {postNote.isPending ? 'Posting...' : 'Share'}
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
          <MessageCircle size={13} /> Share an update
        </button>
      )}
    </section>
  )
}
