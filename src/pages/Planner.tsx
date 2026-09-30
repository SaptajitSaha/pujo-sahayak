import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Navigation, Plus, Share2, Sparkles, Trash2, X } from 'lucide-react'
import { Button, Card, Chip, Img, Page } from '../components/ui'
import { places, placeById, PLAN_DAY_DATES } from '../data/demo'
import { PLAN_DAYS, useApp } from '../store'
import { haversineKm } from '../lib/geo'
import { optimizeRoute } from '../lib/route'
import { buildIcs, downloadIcs, type IcsStop } from '../lib/ics'
import { useT } from '../i18n'
import type { PlanDay, PlanStop } from '../data/types'

const fmt = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

// Bolo/2026 defaults: a Puja evening out is ~4 hours; each pandal averages
// 45 min darshan + photos. Overridable only if the user has already planned a
// very long day — the button then keeps everything and just reorders.
const DEFAULT_BUDGET_MIN = 240
const DEFAULT_AVG_DWELL_MIN = 45

export default function Planner() {
  const t = useT()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const planner = useApp((s) => s.planner)
  const addStop = useApp((s) => s.addStop)
  const removeStop = useApp((s) => s.removeStop)
  const reorderStops = useApp((s) => s.reorderStops)
  const [day, setDay] = useState<PlanDay>(() => {
    const p = params.get('day')
    return p && (PLAN_DAYS as string[]).includes(p) ? (p as PlanDay) : 'saptami'
  })
  const [picker, setPicker] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // A shared /planner?day=X&stops=id1,id2 URL materialises itself into the
  // user's Zustand store on mount — but only for stops that aren't already
  // on that day, so a re-open of an old link doesn't duplicate. After applying
  // we clear the query string so a page refresh doesn't re-run the merge.
  useEffect(() => {
    const stopsParam = params.get('stops')
    if (!stopsParam) return
    const ids = stopsParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (!ids.length) return
    const existing = new Set(planner[day].map((s) => s.placeId))
    let cursorH = 18
    for (const id of ids) {
      if (existing.has(id)) continue
      const p = placeById(id)
      if (!p) continue
      addStop(day, {
        placeId: id,
        time: `${String(cursorH).padStart(2, '0')}:00`,
        durationMin: p.type === 'pandal' ? 45 : 60,
      })
      cursorH = Math.min(23, cursorH + 1)
    }
    params.delete('stops')
    params.delete('day')
    setParams(params, { replace: true })
    // Only react on URL change; intentionally not depending on planner/addStop
    // to avoid running the merge on every keystroke re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const stops = planner[day]

  const handleOptimize = () => {
    // Prefer the user's current geolocation; fall back to first stop's lat/lng
    // so the algorithm still has a valid start when offline.
    const first = placeById(stops[0]?.placeId)
    const start = first ?? { lat: 22.5626, lng: 88.3630, name: 'Kolkata' } // Kolkata central
    const input = stops.map((s) => placeById(s.placeId)).filter((p): p is NonNullable<typeof p> => !!p)
    const result = optimizeRoute(input, {
      startLat: start.lat,
      startLng: start.lng,
      budgetMin: DEFAULT_BUDGET_MIN,
      avgDwellMin: DEFAULT_AVG_DWELL_MIN,
    })
    const existing = new Map<string, PlanStop>(stops.map((s) => [s.placeId, s]))
    const reordered: PlanStop[] = result.ordered.map((p, i) => {
      const prev = existing.get(p.id)!
      // Re-project start times from the optimised sequence — each hop adds
      // (travel + 3 min overhead); dwell carries over unchanged.
      const legMin = result.legs[i]?.min ?? 0
      const prevTime = i === 0 ? prev.time : reordered[i - 1].time
      const [h, m] = prevTime.split(':').map(Number)
      const base = i === 0 ? h * 60 + m : h * 60 + m + legMin + prev.durationMin
      const nh = Math.min(23, Math.floor(base / 60))
      const nm = Math.round((base % 60) / 5) * 5
      return { ...prev, time: `${String(nh).padStart(2, '0')}:${String(nm % 60).padStart(2, '0')}` }
    })
    reorderStops(day, reordered)
    if (result.dropped.length) {
      setToast(`Cut ${result.dropped.length} stop${result.dropped.length > 1 ? 's' : ''} to fit ${Math.round(DEFAULT_BUDGET_MIN / 60)} h`)
      setTimeout(() => setToast(null), 3500)
    }
  }

  const handleExportIcs = () => {
    if (!stops.length) return
    const icsStops: IcsStop[] = stops
      .map((s) => ({ place: placeById(s.placeId), time: s.time, durationMin: s.durationMin, date: PLAN_DAY_DATES[day] }))
      .filter((s): s is IcsStop & { place: NonNullable<typeof s.place> } => !!s.place)
      .map((s) => ({ ...s, place: s.place! }))
    const blob = buildIcs({
      prodId: 'Pujo Sahayak Planner',
      calendarName: `Pujo Sahayak — ${cap(day)} ${PLAN_DAY_DATES[day]}`,
      stops: icsStops,
    })
    downloadIcs(blob, `pujo-${day}-${PLAN_DAY_DATES[day]}.ics`)
    setToast(`${icsStops.length} event${icsStops.length > 1 ? 's' : ''} exported`)
    setTimeout(() => setToast(null), 2500)
  }

  const handleShare = async () => {
    if (!stops.length) return
    const ids = stops.map((s) => s.placeId).join(',')
    const url = `${window.location.origin}/planner?day=${day}&stops=${ids}`
    const title = `My ${cap(day)} plan — Pujo Sahayak`
    const text = `${stops.length} stops planned for ${cap(day)}: ${stops
      .map((s) => placeById(s.placeId)?.name)
      .filter(Boolean)
      .join(' → ')}`
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {
        /* user cancelled or API rejected — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setToast('Link copied')
      setTimeout(() => setToast(null), 2500)
    } catch {
      setToast('Sharing not available')
      setTimeout(() => setToast(null), 2500)
    }
  }

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
              <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
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
          onClick={handleOptimize}
          title="Reorders stops by distance — 2-opt polish over the walking route"
        >
          <Sparkles size={15} /> {t('optimizeRoute')}
        </Button>
      </div>
      {stops.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleExportIcs}>
            <Calendar size={15} /> {t('addToCalendar')}
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 size={15} /> {t('sharePlan')}
          </Button>
        </div>
      )}
      {stops.length > 0 && (
        <Button variant="dark" className="mt-2 w-full" onClick={() => nav(`/trip/${day}`)}>
          <Navigation size={15} /> {t('startNav')}
        </Button>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="glass-strong rounded-full px-4 py-2 text-xs font-medium">{toast}</div>
        </div>
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
