import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Button } from '../ui'
import { useT } from '../../i18n'

/**
 * The "Rate this pandal" modal — the review flow extracted from PandalDetail so
 * the page keeps its orchestration and this keeps its own draft state. The
 * review itself stays on-device (see the honest footer note); this component
 * only collects it and hands it up.
 */
export function ReviewSheet({
  placeName, onSubmit, onCancel,
}: {
  placeName: string
  onSubmit: (rating: number, text: string) => void
  onCancel: () => void
}) {
  const t = useT()
  const [draftRating, setDraftRating] = useState(0)
  const [draftText, setDraftText] = useState('')
  // Focus the sheet when it opens: the Escape handler lives on the overlay, so
  // without this the key event never reaches it when the user opened the modal
  // by clicking the "Rate this" chip (focus stays outside).
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => { dialogRef.current?.focus() }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night/60"
      onClick={onCancel}
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
      role="presentation"
    >
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg rounded-t-2xl bg-card p-4 outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        <h3 id="review-modal-title" className="text-base font-semibold">{t('rateThis')} — {placeName}</h3>
        <div className="mt-3 flex justify-center gap-1" role="radiogroup" aria-label="Star rating, 1 to 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={draftRating === n}
              aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setDraftRating(n)}
              className="p-1 text-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-vermilion rounded"
            >
              <span className={n <= draftRating ? 'text-gold-bright' : 'text-ink/20'}>★</span>
            </button>
          ))}
        </div>
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Optional: what stood out?"
          rows={3}
          aria-label="Optional review text"
          className="mt-3 w-full rounded-card border border-ink/10 bg-ivory-deep p-3 text-sm outline-none focus:border-vermilion"
        />
        <div className="mt-3 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1" disabled={draftRating === 0} onClick={() => onSubmit(draftRating, draftText)}>Save review</Button>
        </div>
        <p className="mt-2 text-[10px] text-faint">Reviews stay on this device in the demo build — no account, no upload.</p>
      </motion.div>
    </div>,
    document.body,
  )
}
