import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navigation, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { Button, Card, Chip, Img, Page } from '../components/ui'
import { places, placeById } from '../data/demo'
import { PLAN_DAYS, useApp, haversineKm } from '../store'
import { useT } from '../i18n'
import type { PlanDay } from '../data/types'

const fmt = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export default function Planner() {
  const t = useT()
  const nav = useNavigate()
  const planner = useApp((s) => s.planner)
  const addStop = useApp((s) => s.addStop)
  const removeStop = useApp((s) => s.removeStop)
  const optimizeDay = useApp((s) => s.optimizeDay)
  const [day, setDay] = useState<PlanDay>('saptami')
  const [picker, setPicker] = useState(false)

  const stops = planner[day]

  return (
    <Page>
      <h1 className="text-xl font-semibold">{t('myPujaPlan')}</h1>

      {/* Day tabs */}
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        {PLAN_DAYS.map((d) => (
          <Chip key={d} active={day === d} onClick={() => setDay(d)} className="capitalize">
            {d}{planner[d].length ? ` · ${planner[d].length}` : ''}
          </Chip>
        ))}
      </div>

      {/* Timeline */}
      <div className="mt-4 space-y-1">
        {stops.length === 0 && (
          <Card className="p-5 text-center text-sm text-faint">
            Nothing planned for {day} yet. Add pandals, restaurants and events to build your evening.
          </Card>
        )}
        {stops.map((stop, i) => {
          const p = placeById(stop.placeId)
          if (!p) return null
          const prev = i > 0 ? placeById(stops[i - 1].placeId) : null
          const travel = prev ? haversineKm(prev.lat, prev.lng, p.lat, p.lng) : null
          return (
            <div key={stop.placeId}>
              {prev && travel !== null && (
                <div className="ml-5 border-l-2 border-dashed border-ink/15 py-1.5 pl-4 text-[11px] text-faint">
                  🚶 {travel.toFixed(1)} km · ~{Math.max(5, Math.round(travel * 4))} min travel
                </div>
              )}
              <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="flex items-center gap-3 p-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vermilion text-xs font-bold text-on-image">{i + 1}</span>
                  <Img palette={p.palette} alt={p.name} className="h-12 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-faint">
                      {fmt(stop.time)} · {cap(p.type)} · {stop.durationMin} min
                    </p>
                  </div>
                  <button aria-label={`Remove ${p.name}`} onClick={() => removeStop(day, stop.placeId)} className="text-faint hover:text-vermilion">
                    <Trash2 size={15} />
                  </button>
                </Card>
              </motion.div>
            </div>
          )
        })}
      </div>
      {stops.length > 0 && <p className="mt-2 text-right text-[10px] text-faint">{t('suggestedRoute')}</p>}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setPicker(true)}>
          <Plus size={15} /> {t('addPlace')}
        </Button>
        <Button
          className="flex-1" disabled={stops.length < 2}
          onClick={() => { optimizeDay(day); }}
          title="Reorders stops by distance — a suggestion"
        >
          <Sparkles size={15} /> {t('optimizeAI')}
        </Button>
      </div>
      {stops.length > 0 && (
        <Button variant="dark" className="mt-2 w-full" onClick={() => nav(`/trip/${day}`)}>
          <Navigation size={15} /> {t('startNav')}
        </Button>
      )}

      {/* Place picker */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/50" onClick={() => setPicker(false)}>
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="max-h-[70vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t('addPlace')} — {cap(day)}</h2>
              <button aria-label="Close" onClick={() => setPicker(false)} className="text-faint"><X size={18} /></button>
            </div>
            {places.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const last = stops[stops.length - 1]
                  const startH = last ? Math.min(23, Number(last.time.split(':')[0]) + Math.ceil(last.durationMin / 60) + 1) : 18
                  addStop(day, { placeId: p.id, time: `${String(startH).padStart(2, '0')}:00`, durationMin: p.type === 'pandal' ? 45 : 60 })
                  setPicker(false)
                }}
                className="flex w-full items-center gap-3 border-b border-ink/5 py-2.5 text-left"
              >
                <Img palette={p.palette} alt={p.name} className="h-10 w-10 rounded-lg" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{p.name}</span>
                  <span className="block text-xs text-faint">{cap(p.type)} · {p.area} · {p.distanceKm} km</span>
                </span>
                <Plus size={16} className="text-vermilion" />
              </button>
            ))}
          </motion.div>
        </div>
      )}
    </Page>
  )
}
