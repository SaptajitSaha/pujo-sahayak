import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, Share2, Stamp } from 'lucide-react'
import { Button, Card, Img, Page, SectionHeader } from '../components/ui'
import { placeById, tithis } from '../data/demo'
import type { PlanDay } from '../data/types'
import { useApp } from '../store'
import { useT } from '../i18n'

// The six public darshan days the passport boards, in festival order.
const TITHI_ORDER: PlanDay[] = ['panchami', 'shashthi', 'saptami', 'ashtami', 'navami', 'dashami']

/**
 * Puja Passport — a seal per tithi, earned only from the user's own GPS-verified
 * check-ins (the same honest log the Scorecard uses). A tithi is stamped when the
 * check-in log holds at least one visit whose `tithi` equals that plan day; empty
 * tithis are shown as locked, never pre-filled. Nothing here is invented: if the
 * log is empty the board is entirely locked.
 */
export default function Passport() {
  const t = useT()
  const nav = useNavigate()
  const flags = useApp((s) => s.featureFlags)
  const checkins = useApp((s) => s.checkins)

  if (!flags.ENABLE_PUJA_PASSPORT) return <Navigate to="/profile" replace />

  const stampFor = (day: PlanDay) => checkins.filter((c) => c.tithi === day)
  const earned = TITHI_ORDER.filter((day) => stampFor(day).length > 0).length

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const shareText = () => {
    const lines = TITHI_ORDER.map((day) => {
      const ss = stampFor(day)
      if (!ss.length) return `${dayName(day)}: —`
      const place = placeById(ss[0].placeId)
      return `${dayName(day)}: ${place?.name ?? 'pandal'} (${fmtDate(ss[0].ts)})`
    })
    return `My Pujo Sahayak Puja Passport — ${earned}/${TITHI_ORDER.length} tithis stamped:\n${lines.join('\n')}`
  }

  const share = async () => {
    const text = shareText()
    if (navigator.share) {
      try { await navigator.share({ title: 'My Puja Passport', text }); return } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(text) } catch { /* clipboard unavailable */ }
  }

  function dayName(day: PlanDay): string {
    return tithis.find((x) => x.planDay === day)?.name ?? day
  }

  return (
    <Page>
      <header className="flex items-center gap-2">
        <button aria-label="Back" onClick={() => nav(-1)} className="text-ink-soft"><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{t('passport')}</h1>
          <p className="text-[11px] text-faint">{t('passportSub')}</p>
        </div>
      </header>

      {/* Progress strip — real count of tithis the user has actually stamped. */}
      <div className="mt-4 flex items-center justify-between rounded-card bg-ivory-deep px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-semibold"><Stamp size={16} className="text-vermilion" /> {earned} / {TITHI_ORDER.length}</span>
        <span className="text-[11px] text-ink-soft">{t('passportProgress')}</span>
      </div>

      {checkins.length === 0 && (
        <Card className="mt-4 p-4 text-[13px] leading-snug text-ink-soft">{t('passportEmpty')}</Card>
      )}

      <section className="mt-5">
        <SectionHeader title={t('passport')} />
        <div className="grid grid-cols-2 gap-3">
          {TITHI_ORDER.map((day) => {
            const ss = stampFor(day)
            const th = tithis.find((x) => x.planDay === day)
            const first = ss[0] ? placeById(ss[0].placeId) : undefined
            return (
              <Card key={day} className={`relative overflow-hidden p-3 ${ss.length ? '' : 'opacity-70'}`}>
                <p className="text-sm font-semibold">{th?.name ?? day}</p>
                <p className="bn text-[11px] text-faint">{th?.nameBn}</p>
                {ss.length > 0 && first ? (
                  <>
                    <Img palette={first.palette} alt={first.name} className="mt-2 h-20 w-full rounded-md" />
                    <p className="mt-1.5 line-clamp-1 text-xs font-medium text-ink">{first.name}</p>
                    <p className="text-[10px] text-vermilion">{t('stampedOn')} · {fmtDate(ss[0].ts)}{ss.length > 1 ? ` · +${ss.length - 1}` : ''}</p>
                    <span aria-hidden className="absolute right-2 top-2 rounded-full bg-vermilion/15 p-1.5 text-vermilion"><Stamp size={14} /></span>
                  </>
                ) : (
                  <div className="mt-2 grid h-20 place-items-center rounded-md border border-dashed border-ink/15 text-[11px] text-faint">
                    {t('stampLocked')}
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {checkins.length > 0 && (
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={share}>
            <Share2 size={14} /> {t('passportShare')}
          </Button>
        )}
      </section>
    </Page>
  )
}
