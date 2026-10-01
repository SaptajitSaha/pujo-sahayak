import { Megaphone } from 'lucide-react'
import { placeById } from '../data/demo'
import { isStale, useCityNotices } from '../services/authority'
import { relativeTime } from '../services/liveNotes'
import { Card, SectionHeader } from './ui'
import { useT } from '../i18n'

/**
 * Home-level festival notices digest (5a) — every official notice across the
 * selected city's pandals, fresh (unexpired) only. Each row carries an "applies
 * to" line pulled from the notice's own place record, so a road closure never
 * looks city-wide when it is one pandal's gate. Renders nothing when there are
 * no live notices — no filler, no fake alerts.
 */
export function FestivalNoticesDigest({ placeIds, onOpenPlace }: { placeIds: string[]; onOpenPlace: (placeId: string) => void }) {
  const t = useT()
  const { data: notices = [] } = useCityNotices(placeIds)
  const fresh = notices.filter((n) => !isStale(n.expires_at))
  if (fresh.length === 0) return null

  return (
    <section className="mt-7">
      <SectionHeader title={t('noticesDigest')} />
      <p className="-mt-1 mb-2 text-[11px] text-faint">{t('noticesDigestSub')}</p>
      <div className="space-y-2">
        {fresh.map((n) => {
          const place = placeById(n.place_id)
          const isDemo = n.source.includes('DEMO')
          return (
            <button
              key={n.id}
              onClick={() => place && onOpenPlace(place.id)}
              className="w-full text-left active:scale-[0.99]"
            >
              <Card className="border-l-[3px] border-l-gold p-2.5">
                <p className="text-[13px] font-medium leading-snug text-ink">{n.text}</p>
                <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-faint">
                  <span className="min-w-0 truncate">
                    <span className="font-semibold text-gold-dark">{t('appliesTo')}</span>
                    {' · '}{place ? `${place.name}${place.area ? ` (${place.area})` : ''}` : '—'}
                  </span>
                  <span className="shrink-0">{isDemo ? 'Demo · ' : ''}{relativeTime(n.created_at)}</span>
                </div>
              </Card>
            </button>
          )
        })}
      </div>
      <p className="mt-1 flex items-center gap-1 text-[9px] italic text-faint">
        <Megaphone size={10} /> Demo notices shown for illustration when no live authority feed is connected.
      </p>
    </section>
  )
}
