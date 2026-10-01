import { useState } from 'react'
import { Flag, Accessibility } from 'lucide-react'
import { Card, Chip, SectionHeader } from './ui'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { Place } from '../data/types'

/**
 * Accessibility information for a pandal. The `accessibility` tags are seeded
 * illustrative values (not surveyed ground truth) — the caption says so, and a
 * one-tap "report if incorrect" queues a local report (never transmitted unless
 * a backend is configured), feeding the same reporting flow as other info.
 */
export function AccessibilityInfo({ place }: { place: Place }) {
  const t = useT()
  const addReport = useApp((s) => s.addReport)
  const [reported, setReported] = useState(false)
  const items = place.accessibility ?? []
  if (!items.length) return null

  const report = () => {
    addReport({ target_type: 'place_info', target_id: place.id, reason: 'accessibility', note: 'Accessibility info looks incorrect' })
    setReported(true)
  }

  return (
    <section className="mt-5">
      <SectionHeader title={t('accessTitle')} />
      <Card className="p-3.5">
        <div className="flex flex-wrap gap-1.5">
          {items.map((a) => (
            <Chip key={a} className="!text-[11px]"><Accessibility size={11} className="mr-1 inline" /> {a}</Chip>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[10px] text-faint">{t('accessSub')}</p>
          <button
            onClick={report}
            disabled={reported}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1 text-[11px] font-medium text-ink-soft disabled:opacity-60"
          >
            <Flag size={11} /> {reported ? t('accessReported') : t('accessReport')}
          </button>
        </div>
      </Card>
    </section>
  )
}
