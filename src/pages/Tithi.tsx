import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Sparkles } from 'lucide-react'
import { Card, Chip, Page, Reveal, SectionHeader } from '../components/ui'
import { DayWeatherChip } from '../components/Weather'
import { tithis, PLAN_DAY_DATES } from '../data/demo'
import type { PlanDay } from '../data/types'
import { useT } from '../i18n'

/**
 * Vertical timeline of the 10 Puja tithis (Mahalaya → Dashami/Bijoya).
 * Each day: name, ritual, auspicious window, "what to do today", and a
 * "Plan this day" CTA that deep-links the Planner with that tab selected.
 *
 * Data is demo-seeded for the 2026 calendar; a production build reads from a
 * tithi feed (sky-calc / ISKCON table) so it stays correct year over year.
 */
export default function Tithi() {
  const t = useT()
  const nav = useNavigate()

  // Highlight the day matching the visitor's real local date when the puja
  // week is actually happening (2026: Oct 2 – Oct 8). Outside that window we
  // surface no "today" chip rather than pretend.
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  const dateToPlanDay: Record<string, string> = {
    '2026-10-03': 'panchami',
    '2026-10-04': 'shashthi',
    '2026-10-05': 'saptami',
    '2026-10-06': 'ashtami',
    '2026-10-07': 'navami',
    '2026-10-08': 'dashami',
  }
  const todayKey = dateToPlanDay[iso]

  // Weather belongs only on the six public planning days. Show the chip just
  // when a tithi's own calendar date equals that plan-day's date — this excludes
  // Pratipada (whose planDay is "prep for Shashthi" but which falls on Oct 2),
  // avoiding a mismatched date and a duplicate fetch.
  const localISO = (s: string) => {
    const d = new Date(s)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }

  const planDayFor = (pd?: string) => pd ?? 'ashtami'

  return (
    <Page>
      <h1 className="text-xl font-semibold">{t('tithi')}</h1>
      <p className="mt-1 text-xs text-faint">{t('tithiSub')}</p>

      <div className="relative mt-4 space-y-3 pl-5">
        {/* Vertical timeline rail — subtle gradient line behind the dots. */}
        <div aria-hidden className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-vermilion/60 via-gold-bright/40 to-transparent" />

        {tithis.map((th, i) => {
          const isToday = th.planDay === todayKey
          return (
            <Reveal key={th.id} delay={i * 0.04}>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                {/* Timeline dot */}
                <span className={`absolute -left-3 top-6 h-3 w-3 rounded-full ring-4 ring-ink/5 ${isToday ? 'bg-vermilion' : 'bg-gold-bright/70'}`} />
                <Card className={`p-3 ${isToday ? 'ring-2 ring-vermilion' : ''}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wide text-faint">{th.date}</p>
                      <h2 className="mt-0.5 font-display text-lg">{th.name}</h2>
                      <p className="bn mt-0.5 text-sm text-ink-soft">{th.nameBn}</p>
                    </div>
                    {isToday && (
                      <span className="shrink-0 rounded-full bg-vermilion px-2 py-0.5 text-[10px] font-bold text-white">
                        {t('todayTithi')}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[13px] leading-snug text-ink-soft">{th.ritual}</p>
                  <p className="mt-1 text-[11px] text-faint">🕐 {th.window}</p>
                  <p className="mt-2 text-sm">{th.whatToDo}</p>
                  {th.planDay && localISO(th.date) === PLAN_DAY_DATES[th.planDay as PlanDay] && (
                    <DayWeatherChip day={th.planDay as PlanDay} className="mt-1.5" />
                  )}
                  {th.planDay && (
                    <div className="mt-3 flex gap-2">
                      <Chip onClick={() => nav(`/planner?day=${planDayFor(th.planDay)}`)}>
                        <Calendar size={12} /> {t('planThisDay')}
                      </Chip>
                      <Chip onClick={() => nav('/walks')}>
                        <Sparkles size={12} /> Suggested walks
                      </Chip>
                    </div>
                  )}
                </Card>
              </motion.div>
            </Reveal>
          )
        })}
      </div>

      <SectionHeader title="About this timeline" />
      <p className="text-[10px] leading-relaxed text-faint">
        Tithi dates are precomputed for the 2026 Durga Puja calendar. In production the app pulls them
        from a Hindu-almanac feed so the sequence stays correct across years and timezones.
      </p>
    </Page>
  )
}
