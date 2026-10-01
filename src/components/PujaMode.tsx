import { Flame, Stamp } from 'lucide-react'
import { PLAN_DAY_DATES, tithis } from '../data/demo'
import type { PlanDay } from '../data/types'
import { useApp } from '../store'
import { useT } from '../i18n'

const ORDER: PlanDay[] = ['panchami', 'shashthi', 'saptami', 'ashtami', 'navami', 'dashami']

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const isoDay = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const nameOf = (day: PlanDay) => tithis.find((x) => x.planDay === day)?.name ?? day

/**
 * Puja Mode (4a) — a seasonal re-ordering of facts that already exist, not new
 * data. Inside the real 2026 puja window (or under the honest `tithiDemoMode`
 * toggle for reviewers / diaspora) it shows a countdown to the next tithi and a
 * real passport-progress strip (distinct tithis the user has actually stamped).
 * Outside the window it renders nothing, so Home collapses to today's behaviour.
 */
export function PujaModeStrip({ isDemo }: { isDemo: boolean }) {
  const t = useT()
  const checkins = useApp((s) => s.checkins)

  // Under demo mode we pin "now" to Ashtami evening so the season flow is still
  // reviewable; a small "demo" tag on the label keeps that honest.
  const now = isDemo ? new Date('2026-10-06T18:00:00') : new Date()
  const todayIso = isoDay(now)
  const todayStart = startOfDay(now)

  const todaysDay = ORDER.find((d) => PLAN_DAY_DATES[d] === todayIso) ?? null
  const nextEntry = ORDER
    .map((d) => ({ day: d, date: startOfDay(new Date(PLAN_DAY_DATES[d] + 'T00:00:00')) }))
    .find((e) => e.date > todayStart) ?? null

  // Past the last tithi and not in demo mode → the season is over, hide.
  if (!todaysDay && !nextEntry && !isDemo) return null

  const earned = ORDER.filter((d) => checkins.some((c) => c.tithi === d)).length
  const daysToNext = nextEntry ? Math.round((nextEntry.date.getTime() - todayStart.getTime()) / 86_400_000) : null

  return (
    <div className="mt-2 overflow-hidden rounded-card border border-gold/30 bg-gradient-to-r from-gold/10 to-vermilion-tint px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-white"><Flame size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-dark">
            {t('pujaMode')}
            {isDemo && <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[9px] normal-case tracking-normal text-ink-soft">demo</span>}
          </p>
          {todaysDay ? (
            <p className="truncate text-sm font-semibold">
              {t('todayIs')} <span className="text-vermilion">{nameOf(todaysDay)}</span>
              {nextEntry && daysToNext !== null ? ` · ${nameOf(nextEntry.day)} ${daysToNext} ${t('daysToGo')}` : ''}
            </p>
          ) : nextEntry ? (
            <p className="truncate text-sm font-semibold">
              {nameOf(nextEntry.day)} <span className="text-vermilion">{daysToNext} {t('daysToGo')}</span>
            </p>
          ) : (
            <p className="truncate text-sm font-semibold">{nameOf('ashtami')} · {t('todayIs')}</p>
          )}
        </div>
        {checkins.length > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-ivory-deep px-2 py-1 text-[11px] font-semibold text-ink">
            <Stamp size={12} className="text-vermilion" /> {earned}/{ORDER.length}
          </span>
        )}
      </div>
    </div>
  )
}
