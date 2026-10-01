import { useMemo } from 'react'
import { Sun, Sunset, AlertTriangle } from 'lucide-react'
import { bestWindows, type CrowdRank } from '../lib/bestTime'
import type { Place } from '../data/types'
import { useT } from '../i18n'

const RANK_STYLE: Record<CrowdRank, { text: string; bg: string }> = {
  calm: { text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
  moderate: { text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-500/10' },
  busy: { text: 'text-rose-600 dark:text-rose-300', bg: 'bg-rose-500/10' },
}

/**
 * "Best time to visit" — calm windows and the peak to avoid, computed by
 * `bestTime` from opening hours + the seeded crowd level. Static (no fetch,
 * no motion beyond the parent's own reveal), so it costs nothing at rest.
 */
export function BestTime({ place }: { place: Place }) {
  const t = useT()
  const readout = useMemo(() => bestWindows(place), [place])
  if (!readout.best.length && !readout.avoid) return null

  return (
    <section className="glass mt-4 rounded-card p-3.5" aria-label={t('bestTimeTitle')}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">{t('bestTimeTitle')}</h2>

      <ul className="mt-2.5 space-y-2">
        {readout.best.map((w) => {
          const s = RANK_STYLE[w.rank]
          return (
            <li key={w.label} className="flex items-center gap-2.5">
              <span className={`shrink-0 rounded-full p-1.5 ${s.bg} ${s.text}`}>
                {w.startHour >= 17 ? <Sunset size={14} /> : <Sun size={14} />}
              </span>
              <span className={`text-[13px] font-semibold ${s.text}`}>{w.label}</span>
              <span className="ml-auto text-[11px] capitalize text-faint">{w.rank}</span>
            </li>
          )
        })}
        {readout.avoid && (
          <li className="flex items-center gap-2.5 border-t border-ink/5 pt-2">
            <span className="shrink-0 rounded-full bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-300">
              <AlertTriangle size={14} />
            </span>
            <span className="text-[13px] font-semibold text-rose-600 dark:text-rose-300">{readout.avoid.label}</span>
            <span className="ml-auto text-[11px] text-faint">avoid · peak</span>
          </li>
        )}
      </ul>

      <p className="mt-2.5 text-[10px] leading-snug text-faint">
        {readout.hasCrowdData ? t('bestTimeSub') : `${t('bestTimeSub')} · typical pattern`}
      </p>
    </section>
  )
}
