// ─── Official Notices section ────────────────────────────────────────────────
// Visually distinct from visitor notes: gold accent, shield icon, "OFFICIAL NOTICE"
// header. Trust-hierarchy: top tier.

import { Shield } from 'lucide-react'
import { useOfficialNotices, useNoticesSubscription, isStale } from '../services/authority'
import { relativeTime } from '../services/liveNotes'
import { QueryError } from './ui'

interface Props {
  placeId: string
}

export function OfficialNotices({ placeId }: Props) {
  const { data: notices = [], isLoading, isError, refetch } = useOfficialNotices(placeId)
  useNoticesSubscription(placeId)

  if (isLoading) {
    return <div className="mt-3 h-8 w-full animate-pulse rounded bg-ivory-deep" />
  }

  if (isError) return <QueryError onRetry={() => refetch()} message="Couldn’t load official notices." />

  if (notices.length === 0) return null

  return (
    <section className="mt-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Shield size={14} className="text-gold" /> Official Notices
      </h2>
      <div className="mt-2.5 space-y-2">
        {notices.map((n) => {
          const stale = isStale(n.expires_at)
          return (
            <div
              key={n.id}
              className={`rounded-lg border-l-[3px] border-l-gold p-2.5 ${stale ? 'opacity-60' : 'bg-gold/5'}`}
            >
              <p className="text-[13px] font-medium leading-snug text-ink">{n.text}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] text-faint">
                  <span className="rounded-full bg-gold/15 px-1.5 py-0.5 font-semibold text-gold-dark">
                    {n.source}
                  </span>
                  {relativeTime(n.created_at)}
                </span>
                {stale && <span className="text-[9px] font-medium uppercase text-faint">Expired</span>}
              </div>
            </div>
          )
        })}
      </div>
      {notices.some((n) => n.source.includes('DEMO')) && (
        <p className="mt-1 text-[9px] italic text-faint">Demo notices shown for illustration. No live authority feed connected.</p>
      )}
    </section>
  )
}
