import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card, Img, Page, Rail, SectionHeader } from '../components/ui'
import { RailCard } from '../components/PlaceCard'
import { events, meetups, restaurants } from '../data/demo'
import { useT } from '../i18n'

/** The off-season promise (doc §36): the same discovery system, without the pandals. */
export default function BeyondPuja() {
  const t = useT()
  const nav = useNavigate()

  return (
    <Page>
      {/* Hero */}
      <Card className="grain relative">
        <Img palette={{ from: '#141026', to: '#3a2450' }} alt="Kolkata at night" className="h-56">
          {/* Victoria Memorial silhouette */}
          <svg viewBox="0 0 300 90" className="absolute bottom-0 w-full text-black/60" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 90 L0 70 L40 70 L40 60 L60 60 L60 70 L110 70 L110 55 L125 40 L132 20 L139 40 L150 55 L150 70 L200 70 L200 60 L220 60 L220 70 L300 70 L300 90 Z" />
            <circle cx="135" cy="16" r="4" />
          </svg>
          <div className="absolute inset-x-0 bottom-10 p-4 text-center text-on-image">
            <h1 className="font-display text-2xl leading-snug">{t('beyondPuja')}</h1>
            <p className="mt-1 text-xs text-on-image/75">{t('beyondPujaSub')}</p>
          </div>
          <button
            onClick={() => document.getElementById('bp-content')?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full grad-brand px-5 py-2 text-xs font-semibold text-white glow-vermilion"
          >
            {t('discoverMore')}
          </button>
        </Img>
      </Card>

      <div id="bp-content">
        <section className="mt-6">
          <SectionHeader title="Restaurants" action={t('viewAll')} onAction={() => nav('/search?type=restaurant')} />
          <Rail>{restaurants.map((r) => <RailCard key={r.id} place={r} />)}</Rail>
        </section>

        <section className="mt-5">
          <SectionHeader title="Events & Activities" />
          <div className="space-y-2">
            {events.map((e) => (
              <button key={e.id} onClick={() => nav(`/search?q=${encodeURIComponent(e.name)}`)} className="w-full text-left">
                <Card className="flex items-center gap-3 p-3 transition-transform hover:scale-[1.01]">
                  <Img palette={e.palette} alt={e.name} className="h-12 w-12 rounded-lg" sizes="48px" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{e.name}</p>
                    <p className="text-xs text-faint">{e.date} • {e.time} • {e.venue}</p>
                  </div>
                  <ChevronRight size={15} className="shrink-0 text-faint" />
                </Card>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <SectionHeader title="Meetups" action={t('meets')} onAction={() => nav('/meets')} />
          <Rail>
            {meetups.map((m) => (
              <button key={m.id} onClick={() => nav('/meets')} className="text-left">
                <Card className="w-52 shrink-0 transition-transform hover:scale-[1.02]">
                  <Img palette={m.palette} alt={m.title} className="h-20" />
                  <div className="p-2.5">
                    <p className="truncate text-[13px] font-semibold">{m.title}</p>
                    <p className="text-[11px] text-faint">{m.date} • {m.time}</p>
                  </div>
                </Card>
              </button>
            ))}
          </Rail>
        </section>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-faint">
          Puja is the heart, not the whole body. The same Discover → Plan → Visit → Meet loop keeps
          working all year — that is how Pujo Sahayak stays a companion, not a calendar event.
        </p>
      </div>
    </Page>
  )
}
