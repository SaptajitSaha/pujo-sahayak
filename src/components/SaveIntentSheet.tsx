import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Bookmark, X } from 'lucide-react'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { SaveIntent } from '../data/types'

const INTENTS: { intent: SaveIntent; key: 'intentTonight' | 'intentOnSaptami' | 'intentWithFriends' | 'intentForPhotography' | 'intentFoodTrip' | 'intentVisitLater' }[] = [
  { intent: 'tonight', key: 'intentTonight' },
  { intent: 'on-saptami', key: 'intentOnSaptami' },
  { intent: 'with-friends', key: 'intentWithFriends' },
  { intent: 'for-photography', key: 'intentForPhotography' },
  { intent: 'food-trip', key: 'intentFoodTrip' },
  { intent: 'visit-later', key: 'intentVisitLater' },
]

interface Props {
  placeId: string
  placeName: string
  open: boolean
  onClose: () => void
}

/**
 * Optional "why are you saving this?" sheet. Plain Save stays one tap; this
 * only enriches the saved place with an intent the Tonight / What-next engines
 * can use. Choosing an intent also ensures the place is saved.
 */
export function SaveIntentSheet({ placeId, placeName, open, onClose }: Props) {
  const t = useT()
  const reduce = useReducedMotion()
  const saved = useApp((s) => s.saved)
  const toggleSaved = useApp((s) => s.toggleSaved)
  const current = useApp((s) => s.saveIntents[placeId])
  const setSaveIntent = useApp((s) => s.setSaveIntent)
  const clearSaveIntent = useApp((s) => s.clearSaveIntent)

  if (!open) return null

  const pick = (intent: SaveIntent) => {
    if (!saved.includes(placeId)) toggleSaved(placeId)
    setSaveIntent(placeId, intent)
    onClose()
  }
  const justSave = () => {
    if (!saved.includes(placeId)) toggleSaved(placeId)
    else clearSaveIntent(placeId)
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/60" onClick={onClose} role="presentation">
      <motion.div
        initial={reduce ? false : { y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg rounded-t-2xl bg-card p-4 outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="intent-title"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 id="intent-title" className="text-base font-semibold">{t('saveIntentTitle')}</h2>
            <p className="mt-0.5 truncate text-xs text-faint">{placeName}</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-full bg-ivory-deep p-1.5 text-ink-soft"><X size={14} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {INTENTS.map(({ intent, key }) => (
            <button
              key={intent}
              onClick={() => pick(intent)}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${current === intent ? 'border-vermilion bg-vermilion/10 text-vermilion' : 'border-ink/10 text-ink hover:bg-ivory-deep'}`}
            >
              {t(key)}
            </button>
          ))}
        </div>

        <button onClick={justSave} className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium text-ink-soft">
          <Bookmark size={14} /> {t('saveIntentSkip')}
        </button>
      </motion.div>
    </div>,
    document.body,
  )
}

/** Compact label used on cards/badges to show a saved place's intent. */
export function SaveIntentBadge({ intent }: { intent: SaveIntent }) {
  const t = useT()
  const found = INTENTS.find((i) => i.intent === intent)
  const nav = useNavigate()
  if (!found) return null
  return (
    <button
      onClick={(e) => { e.stopPropagation(); nav('/planner') }}
      className="inline-flex items-center gap-1 rounded-full bg-vermilion/10 px-2 py-0.5 text-[10px] font-medium text-vermilion"
    >
      <Bookmark size={10} /> {t(found.key)}
    </button>
  )
}
