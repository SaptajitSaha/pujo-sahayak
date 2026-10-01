import { SectionHeader, Img, type LightboxItem } from './ui'
import { useT } from '../i18n'
import type { Place } from '../data/types'

/**
 * Pandal History — a vertical timeline that re-presents data the place already
 * carries: the first line of its story as the "origin" entry, then one node per
 * recorded past edition (year + theme + palette). Pure re-presentation — no new
 * facts are invented and nothing is fetched.
 */
export function PandalHistory({ place, onOpen }: { place: Place; onOpen: (item: LightboxItem) => void }) {
  const t = useT()
  const editions = place.pastEditions ?? []
  const originLine = place.story ? place.story.split(/(?<=\.)\s+/)[0] : undefined
  if (!originLine && !editions.length) return null

  return (
    <section className="mt-5">
      <SectionHeader title={t('historyTitle')} />
      <ol className="relative mt-2 ml-2 space-y-4 border-l border-ink/15 pl-4">
        {originLine && (
          <li className="relative">
            <span aria-hidden className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-vermilion" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-vermilion">{t('historyOrigin')}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{originLine}</p>
          </li>
        )}
        {editions.map((e) => (
          <li key={e.year} className="relative">
            <span aria-hidden className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-ink/25" />
            <button
              onClick={() => onOpen({ title: `${e.year} — ${e.theme}`, sub: `Past edition of ${place.name}`, palette: e.palette })}
              className="flex items-center gap-2.5 text-left"
            >
              <Img palette={e.palette} alt={`${e.year} theme`} className="h-10 w-10 shrink-0 rounded-md" />
              <span className="min-w-0">
                <p className="text-xs font-semibold text-ink">{e.year}</p>
                <p className="truncate text-[11px] text-ink-soft">{e.theme}</p>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
