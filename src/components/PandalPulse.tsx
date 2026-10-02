import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Camera, Clock, Cross, Moon, TrainFront, Users } from 'lucide-react'
import { computePulse, type PulseIcon, type PulseSource, type PulseTone } from '../lib/pulse'
import { relativeTime } from '../services/liveNotes'
import type { LiveNote, OfficialNotice, Place } from '../data/types'

const ICON: Record<PulseIcon, typeof Users> = {
  users: Users, clock: Clock, window: Moon, metro: TrainFront, medical: Cross, camera: Camera,
}

/** Short provenance tag shown beside a row that a live signal backs. */
const SOURCE_TAG: Record<Exclude<PulseSource, 'modelled'>, string> = {
  official: 'Official', visitor: 'Visitor',
}

// Semantic status colours (green / amber / rose), kept on the same
// emerald-amber-rose scale the rest of the app uses for good/caution/bad.
const TONE: Record<PulseTone, { text: string; orb: string; dot: string }> = {
  good: { text: 'text-emerald-600 dark:text-emerald-300', orb: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-500' },
  warn: { text: 'text-amber-600 dark:text-amber-300', orb: 'bg-amber-500/10 text-amber-600 dark:text-amber-300', dot: 'bg-amber-500' },
  bad: { text: 'text-rose-600 dark:text-rose-300', orb: 'bg-rose-500/10 text-rose-600 dark:text-rose-300', dot: 'bg-rose-500' },
  neutral: { text: 'text-ink', orb: 'bg-vermilion/10 text-vermilion', dot: 'bg-ink/30' },
}

/** Rows that read as a level and get a leading status dot (🔴/🟠/🟢 style). */
const DOTTED = new Set<string>(['crowd'])

/**
 * "Pandal Pulse" — a six-tile at-a-glance status card for the pandal detail
 * page. Renders synchronously from `computePulse` (no fetch, no layout shift),
 * and its only motion is a one-shot mount glow: transform/opacity on two
 * throwaway layers, disabled entirely under prefers-reduced-motion, so it costs
 * nothing at rest and stays well inside the WebView FPS budget.
 */
export function PandalPulse({ place, notices, notes }: { place: Place; notices?: OfficialNotice[]; notes?: LiveNote[] }) {
  const reduce = useReducedMotion()
  const items = useMemo(() => computePulse(place, { now: new Date(), notices, notes }), [place, notices, notes])

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative mt-4 overflow-hidden rounded-card p-3"
      aria-label="Pandal Pulse — at-a-glance status"
    >
      {/* One-shot "live" glow — flashes once on load, never loops. */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-vermilion/20"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.15, opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      )}

      <div className="relative mb-2.5 flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          {!reduce && (
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">Pandal Pulse</h2>
        <span className="ml-auto text-[10px] text-faint">At a glance</span>
      </div>

      <ul className="relative grid grid-cols-2 gap-x-3 gap-y-2.5">
        {items.map((i) => {
          const Icon = ICON[i.icon]
          const tone = TONE[i.tone]
          return (
            <li key={i.key} className="flex min-w-0 items-center gap-2">
              <span className={`shrink-0 rounded-full p-1.5 ${tone.orb}`}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-faint">{i.label}</p>
                <p className={`flex items-center gap-1.5 truncate text-[13px] font-semibold ${tone.text}`}>
                  {DOTTED.has(i.key) && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />}
                  {i.value}
                </p>
                {i.source !== 'modelled' && i.updatedAt && (
                  <p className="truncate text-[9px] text-faint">
                    {SOURCE_TAG[i.source]} · {relativeTime(i.updatedAt)}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* The disclosure has to match the rows above it: an "Illustrative
          snapshot" line under rows that came from an official notice or a
          visitor post wrongly dismissed real, sourced data as sample data. */}
      <p className="relative mt-2.5 text-[10px] leading-snug text-faint">
        {(() => {
          const sourced = items.filter((i) => i.source !== 'modelled')
          const modelled = items.length - sourced.length
          if (modelled === items.length) {
            return 'Illustrative snapshot — modelled from puja-timing patterns, not live sensors.'
          }
          if (modelled === 0) {
            return 'Every row is tagged with its source — an official notice or a visitor post. Nothing here is a live sensor reading.'
          }
          return `${sourced.length} row${sourced.length === 1 ? '' : 's'} above are tagged with their source (official notice or visitor post); the other ${modelled} ${modelled === 1 ? 'is' : 'are'} modelled from opening hours and typical crowd patterns, not live sensors.`
        })()}
      </p>
    </motion.section>
  )
}
