import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Flag, X } from 'lucide-react'
import { Button } from './ui'
import { useApp } from '../store'
import { useT } from '../i18n'

type ReasonKey = 'reasonCrowd' | 'reasonTiming' | 'reasonFacilities' | 'reasonLocation' | 'reasonAccessibility' | 'reasonOutdated'

const REASONS: ReasonKey[] = ['reasonCrowd', 'reasonTiming', 'reasonFacilities', 'reasonLocation', 'reasonAccessibility', 'reasonOutdated']

interface Props {
  placeId: string
  placeName: string
  open: boolean
  onClose: () => void
}

/**
 * Report incorrect info (5b) — a "this looks wrong" micro-flow. The choice is
 * written to the local reports queue (the same LocalReport slice the accessibility
 * report uses) with target_type 'place_info'. There is no backend here, so the
 * confirmation is honest: recorded on this device, not transmitted. When a
 * Supabase service is configured, that queue is what a future sync would send.
 */
export function ReportInfoSheet({ placeId, placeName, open, onClose }: Props) {
  const t = useT()
  const reduce = useReducedMotion()
  const addReport = useApp((s) => s.addReport)
  const [reason, setReason] = useState<ReasonKey | null>(null)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  if (!open) return null

  const reset = () => { setReason(null); setNote(''); setSent(false) }
  const close = () => { reset(); onClose() }
  const submit = () => {
    if (!reason) return
    addReport({ target_type: 'place_info', target_id: placeId, reason: t(reason), note: note.trim() || undefined })
    setSent(true)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/60" onClick={close} role="presentation">
      <motion.div
        initial={reduce ? false : { y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg rounded-t-2xl bg-card p-4 outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="report-title"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 id="report-title" className="flex items-center gap-1.5 text-base font-semibold"><Flag size={15} className="text-vermilion" /> {t('reportInfoTitle')}</h2>
            <p className="mt-0.5 truncate text-xs text-faint">{placeName}</p>
          </div>
          <button aria-label="Close" onClick={close} className="rounded-full bg-ivory-deep p-1.5 text-ink-soft"><X size={14} /></button>
        </div>

        {sent ? (
          <p className="rounded-lg bg-ivory-deep p-3 text-[13px] leading-snug text-ink-soft">{t('reportSent')}</p>
        ) : (
          <>
            <p className="text-[11px] text-faint">{t('reportInfoSub')}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(reason === r ? null : r)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${reason === r ? 'border-vermilion bg-vermilion/10 text-vermilion' : 'border-ink/10 text-ink-soft'}`}
                >
                  {t(r)}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a detail (optional)"
              rows={2}
              className="mt-3 w-full rounded-md border border-ink/15 bg-transparent p-2 text-sm outline-none focus:border-vermilion"
            />
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" onClick={submit} disabled={!reason}>{t('reportSend')}</Button>
              <Button size="sm" variant="outline" onClick={close}>{t('reportCancel')}</Button>
            </div>
          </>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}
