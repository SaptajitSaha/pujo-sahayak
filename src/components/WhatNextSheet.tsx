import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, Sparkles, X } from 'lucide-react'
import { Button } from './ui'
import { placeHref } from './PlaceCard'
import type { NextSuggestion } from '../lib/whatsnext'
import { useT } from '../i18n'

interface Props {
  open: boolean
  onClose: () => void
  suggestions: NextSuggestion[]
}

/**
 * "What should I do next?" — a bottom sheet listing the top scored suggestions.
 * Every card states the honest reason it was chosen; an empty list tells the
 * user to plan or save something rather than showing filler.
 */
export function WhatNextSheet({ open, onClose, suggestions }: Props) {
  const t = useT()
  const nav = useNavigate()
  const reduce = useReducedMotion()
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night/60"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={reduce ? false : { y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-4 outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatnext-title"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="whatnext-title" className="flex items-center gap-1.5 text-base font-semibold">
            <Sparkles size={16} className="text-vermilion" /> {t('whatNextTitle')}
          </h2>
          <button aria-label="Close" onClick={onClose} className="rounded-full bg-ivory-deep p-1.5 text-ink-soft"><X size={14} /></button>
        </div>

        {suggestions.length === 0 ? (
          <p className="py-6 text-center text-sm text-faint">{t('whatNextEmpty')}</p>
        ) : (
          <ul className="space-y-2.5">
            {suggestions.map((s) => (
              <li key={s.place.id}>
                <button
                  onClick={() => { onClose(); nav(placeHref(s.place)) }}
                  className="flex w-full items-center gap-3 rounded-xl border border-ink/5 bg-ivory-deep/40 p-3 text-left transition-transform active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.place.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-faint">
                      <MapPin size={10} /> {s.place.area}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-ink-soft">{s.reason}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button variant="outline" className="mt-4 w-full" onClick={onClose}>{t('done')}</Button>
      </motion.div>
    </div>,
    document.body,
  )
}
