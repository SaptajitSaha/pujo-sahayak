import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Moon, Sparkles } from 'lucide-react'
import { Card } from './ui'
import { placeHref } from './PlaceCard'
import { DayWeatherChip } from './Weather'
import { bestWindows } from '../lib/bestTime'
import type { NextSuggestion } from '../lib/whatsnext'
import type { Place, PlanDay, Tithi } from '../data/types'
import { useT } from '../i18n'

const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`
}

interface Props {
  day: PlanDay
  tithi: Tithi
  isDemo: boolean
  /** Tonight's planned stops (resolved to places), in order. */
  planStops: { place: Place; time: string }[]
  /** The single top "what next" suggestion, when the What-Next flag is on. */
  topSuggestion?: NextSuggestion | null
  onOpenNext: () => void
  showWhatNext: boolean
}

/**
 * Tonight Dashboard — a contextual, evening-first card. It only composes facts
 * the app already has (today's tithi, tonight's plan, modelled best windows,
 * real weather, one next-step suggestion); it never introduces new data. When
 * there is nothing planned it says so honestly rather than filling with noise.
 */
export function TonightDashboard({ day, tithi, isDemo, planStops, topSuggestion, onOpenNext, showWhatNext }: Props) {
  const t = useT()
  const nav = useNavigate()
  // Calmest window per planned stop, modelled — computed once, cheap.
  const windows = useMemo(
    () => new Map(planStops.map((s) => [s.place.id, bestWindows(s.place).best[0]?.label ?? null])),
    [planStops],
  )

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-ink/5 p-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-vermilion-tint text-vermilion"><Moon size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-faint">{t('tonightTitle')}{isDemo && <span className="ml-1 rounded-full bg-ivory-deep px-1.5 text-[9px] normal-case">demo</span>}</p>
          <p className="truncate text-sm font-semibold">{tithi.name}</p>
        </div>
        <span className="text-[11px] text-faint">{tithi.window}</span>
      </div>

      <div className="p-3.5">
        {planStops.length === 0 ? (
          <p className="text-center text-sm text-faint">
            Nothing planned for {day} yet — add pandals in your Puja Plan and they show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {planStops.slice(0, 3).map((s) => {
              const win = windows.get(s.place.id)
              return (
                <li key={s.place.id}>
                  <button onClick={() => nav(placeHref(s.place))} className="flex w-full items-center gap-2 text-left">
                    <span className="flex items-center gap-1 text-xs font-medium text-ink-soft tabular-nums">
                      <Clock size={11} /> {fmtTime(s.time)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{s.place.name}</span>
                    {win && <span className="shrink-0 rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-faint">{win}</span>}
                    <ArrowRight size={13} className="shrink-0 text-faint" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-3">
          <DayWeatherChip day={day} />
        </div>

        {showWhatNext && (
          <button
            onClick={onOpenNext}
            className="mt-3 flex w-full items-center gap-2 rounded-xl bg-vermilion/10 px-3 py-2.5 text-left text-sm font-medium text-vermilion transition-transform active:scale-[0.99]"
          >
            <Sparkles size={15} />
            <span className="min-w-0 flex-1 truncate">
              {topSuggestion ? `Next: ${topSuggestion.place.name} · ${topSuggestion.reason}` : t('whatNextTitle')}
            </span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </Card>
  )
}
