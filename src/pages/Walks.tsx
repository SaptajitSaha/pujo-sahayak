import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Camera, Utensils, Users, Landmark, ChevronRight } from 'lucide-react'
import { Button, Card, Chip, Img, Page, Reveal, SectionHeader } from '../components/ui'
import { walks, placeById } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { Walk, PlanDay } from '../data/types'

const themeIcon = (t: Walk['theme']) =>
  t === 'photography' ? Camera : t === 'food' ? Utensils : t === 'family' ? Users : Landmark

// Each walk's theme maps to a sensible Puja day: golden-hour photographer trails
// work any evening (default Saptami — crowds are still building), the foodie
// circuit best runs on Saptami too (kitchen full, queues shorter than Ashtami),
// and the family stroll is Panchami morning (light crowd, kid-friendly).
const WALK_DAY: Record<Walk['theme'], PlanDay> = {
  photography: 'saptami',
  food: 'saptami',
  family: 'panchami',
  heritage: 'ashtami',
}

export default function Walks() {
  const t = useT()
  const nav = useNavigate()
  const addStop = useApp((s) => s.addStop)
  const planner = useApp((s) => s.planner)

  const addToPlanner = (w: Walk) => {
    const day = WALK_DAY[w.theme]
    let cursorMin = 18 * 60 // 18:00 default start
    w.stops.forEach((stop, i) => {
      const place = placeById(stop.placeId)
      if (!place) return
      // Skip stops already on this day (don't duplicate).
      if (planner[day].some((s) => s.placeId === stop.placeId)) {
        cursorMin += (i === 0 ? stop.durationMin : stop.durationMin + 15)
        return
      }
      const hh = String(Math.floor(cursorMin / 60)).padStart(2, '0')
      const mm = String(cursorMin % 60).padStart(2, '0')
      addStop(day, { placeId: stop.placeId, time: `${hh}:${mm}`, durationMin: stop.durationMin })
      cursorMin += stop.durationMin + 15 // 15 min travel between stops on a walk
    })
    nav(`/planner?day=${day}`)
  }

  return (
    <Page>
      <h1 className="text-xl font-semibold">{t('walks')}</h1>
      <p className="mt-1 text-xs text-faint">{t('walksSub')}</p>

      <div className="mt-4 space-y-4">
        {walks.map((w, wi) => (
          <Reveal key={w.id} delay={wi * 0.06}>
            <Card className="overflow-hidden p-0">
              <div className="relative">
                <Img palette={w.palette} alt={w.title} className="h-36 w-full" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent p-3">
                  <div className="flex items-center gap-2">
                    {(() => { const Icon = themeIcon(w.theme); return <Icon size={16} className="text-marigold" /> })()}
                    <h2 className="text-base font-semibold text-on-image">{w.title}</h2>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-on-image/80">{w.description}</p>
                </div>
              </div>
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between text-[11px] text-faint">
                  <span>{w.stops.length} stops · ~{Math.round(w.totalDurationMin / 60 * 10) / 10} h</span>
                  <span className="rounded-full bg-ink/5 px-2 py-0.5 capitalize">{WALK_DAY[w.theme]}</span>
                </div>
                <ol className="mb-3 space-y-2">
                  {w.stops.map((s, i) => {
                    const p = placeById(s.placeId)
                    if (!p) return null
                    return (
                      <motion.li key={s.placeId} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: wi * 0.05 + i * 0.04 }} className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vermilion/10 text-[10px] font-bold text-vermilion">{i + 1}</span>
                        <Img palette={p.palette} alt={p.name} className="h-8 w-8 shrink-0 rounded-md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="truncate text-[10px] text-faint">{s.highlight} · {s.durationMin} min</p>
                        </div>
                        <button onClick={() => nav(`/pandal/${p.id}`)} aria-label={`Open ${p.name}`} className="text-faint hover:text-vermilion">
                          <ChevronRight size={16} />
                        </button>
                      </motion.li>
                    )
                  })}
                </ol>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => addToPlanner(w)}>
                    <Calendar size={15} /> Add to Planner
                  </Button>
                  <Chip onClick={() => nav(`/trip/${WALK_DAY[w.theme]}`)}>{t('startNav')}</Chip>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <SectionHeader title={t('walks')} />
      <p className="text-[10px] text-faint">Walks are curated routes, not a live crowd guide. Timings assume normal Puja-week pace.</p>
    </Page>
  )
}
