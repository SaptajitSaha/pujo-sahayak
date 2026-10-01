import { Card, SectionHeader, Button } from './ui'
import { Share2 } from 'lucide-react'
import { placeById } from '../data/demo'
import { computePujaStats } from '../lib/pujastats'
import { useApp } from '../store'
import { useT } from '../i18n'

/** "9 PM" / "12 noon" / "0:00"-safe 12-hour label for a 0-23 hour, or null. */
function hourLabel(h: number | null): string {
  if (h == null) return '—'
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

/**
 * Personal Puja Statistics (4d) — every figure comes out of `computePujaStats`,
 * a pure function of the user's own GPS-verified check-in log plus their
 * saved/visited counts. No community benchmark, no invented comparison: if the
 * log is empty the panel says so instead of guessing.
 */
export function PujaStatsPanel() {
  const t = useT()
  const checkins = useApp((s) => s.checkins)
  const saved = useApp((s) => s.saved)
  const visited = useApp((s) => s.visited)

  const stats = computePujaStats({ checkins, saved: saved.length, visited: visited.length })

  return (
    <section className="mt-5">
      <SectionHeader title={t('statsTitle')} />
      <Card className="p-4">
        <p className="text-[11px] text-faint">{t('statsSub')}</p>
        {checkins.length === 0 ? (
          <p className="mt-2 text-[13px] leading-snug text-ink-soft">{t('statsEmpty')}</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Stat label={t('statTithis')} value={String(stats.distinctTithis)} />
            <Stat label={t('statPerDay')} value={stats.pandalsPerDay.toFixed(1)} />
            <Stat label={t('statKm')} value={`\u2248 ${stats.totalKm.toFixed(1)} km`} />
            <Stat label={t('statBusiest')} value={hourLabel(stats.busiestHour)} />
            <Stat label={t('statQuietest')} value={hourLabel(stats.quietestHour)} />
            <Stat label={t('statRatio')} value={stats.savedVsVisited == null ? '—' : `${Math.round(stats.savedVsVisited * 100)}%`} />
          </div>
        )}
      </Card>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ivory-deep/60 p-2.5">
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-faint">{label}</p>
    </div>
  )
}

/**
 * AI-free Puja Recap (4e) — a deterministic, template narrative assembled from
 * the user's own stats, check-ins and one diary line. There is no LLM here: the
 * recap cannot invent a story, so with no real activity it honestly declines.
 */
export function PujaRecap() {
  const t = useT()
  const checkins = useApp((s) => s.checkins)
  const diary = useApp((s) => s.diary)
  const saved = useApp((s) => s.saved)
  const visited = useApp((s) => s.visited)

  const hasActivity = checkins.length > 0
  const stats = computePujaStats({ checkins, saved: saved.length, visited: visited.length })

  const lines: string[] = []
  if (hasActivity) {
    const first = [...checkins].sort((a, b) => a.ts - b.ts)[0]
    const firstPlace = placeById(first.placeId)
    if (firstPlace) {
      lines.push(`First darshan — ${firstPlace.name}, ${new Date(first.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`)
    }
    // Favourite area = the area with the most repeat check-ins (real, counted).
    const byArea = new Map<string, number>()
    for (const c of checkins) {
      const p = placeById(c.placeId)
      if (p) byArea.set(p.area, (byArea.get(p.area) ?? 0) + 1)
    }
    let favArea: string | null = null
    let favCount = 0
    for (const [area, n] of byArea) if (n > favCount) { favCount = n; favArea = area }
    if (favArea) lines.push(`You returned most often to ${favArea} (${favCount} visit${favCount === 1 ? '' : 's'}).`)
    if (stats.longestStreak >= 2) lines.push(`Best streak — ${stats.longestStreak} days in a row.`)
    lines.push(`${stats.distinctPandals} pandal${stats.distinctPandals === 1 ? '' : 's'} across ${stats.distinctTithis} tith${stats.distinctTithis === 1 ? 'i' : 'is'}.`)
    // One diary quote, if the user wrote any.
    const quote = diary.find((d) => d.text.trim())
    if (quote) lines.push(`From your diary (${quote.date}): "${quote.text.trim().split('\n')[0]}"`)
  }

  const text = lines.join('\n')

  const share = async () => {
    if (!navigator.share) { try { await navigator.clipboard.writeText(text) } catch { /* unavailable */ } ; return }
    try { await navigator.share({ title: 'My Puja Recap', text }) } catch { /* cancelled */ }
  }

  return (
    <section className="mt-5">
      <SectionHeader title={t('recapTitle')} />
      <Card className="p-4">
        {!hasActivity ? (
          <p className="text-[13px] leading-snug text-ink-soft">{t('recapEmpty')}</p>
        ) : (
          <>
            <ul className="space-y-1.5 text-sm leading-relaxed text-ink">
              {lines.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={share}>
              <Share2 size={14} /> {t('recapShare')}
            </Button>
          </>
        )}
      </Card>
    </section>
  )
}
