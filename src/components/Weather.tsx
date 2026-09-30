import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun } from 'lucide-react'
import { PLAN_DAY_DATES } from '../data/demo'
import type { PlanDay } from '../data/types'
import { fetchDayWeather, weatherVerdict, type DayWeather } from '../lib/weather'

type Status = 'loading' | 'ok' | 'error'

/** Fetch (and locally cache) the weather for one plan day. */
export function useDayWeather(day: PlanDay) {
  const date = PLAN_DAY_DATES[day]
  const [state, setState] = useState<{ status: Status; weather?: DayWeather; stale?: boolean }>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    fetchDayWeather(date)
      .then((r) => { if (alive) setState({ status: 'ok', weather: r.weather, stale: r.stale }) })
      .catch(() => { if (alive) setState({ status: 'error' }) })
    return () => { alive = false }
  }, [date])

  return { date, ...state }
}

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })

/**
 * Presentational weather line. Its container always reserves a fixed height so
 * the loading → loaded swap causes zero layout shift (CLS budget).
 */
export function WeatherLine({ date, status, weather, stale }: {
  date: string
  status: Status
  weather?: DayWeather
  stale?: boolean
}) {
  return (
    <div className="flex h-5 items-center text-[11px]" aria-live="polite">
      {status === 'loading' && <span className="text-faint">Checking the sky…</span>}

      {status === 'error' && <span className="text-faint">Weather unavailable offline.</span>}

      {status === 'ok' && weather && (() => {
        const v = weatherVerdict(weather)
        const Icon = v.tone === 'rain' ? CloudRain : v.tone === 'warm' ? Sun : Cloud
        const tone =
          v.tone === 'rain' ? 'text-sky-600 dark:text-sky-300'
            : v.tone === 'warm' ? 'text-amber-600 dark:text-amber-300'
              : 'text-emerald-600 dark:text-emerald-300'
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium ${tone}`}>
            <Icon size={12} className="shrink-0" />
            {fmtDate(date)} · {v.label} · {Math.round(weather.tMax)}°/{Math.round(weather.tMin)}°
            {stale && <span className="font-normal text-faint">(cached)</span>}
          </span>
        )
      })()}
    </div>
  )
}

/** Self-contained chip: fetches its own day and renders the line. */
export function DayWeatherChip({ day, className = '' }: { day: PlanDay; className?: string }) {
  const { date, status, weather, stale } = useDayWeather(day)
  return <div className={className}><WeatherLine date={date} status={status} weather={weather} stale={stale} /></div>
}
