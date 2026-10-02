import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X } from 'lucide-react'
import { Card, Chip, Page, Rail, SectionHeader } from '../components/ui'
import { PlaceCard, RailCard, TileCard } from '../components/PlaceCard'
import { places, pandalsIn, restaurantsIn, eventsIn } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'

const PILLS = ['All', 'Pandals', 'Restaurants', 'Events'] as const

export default function SearchPage() {
  const t = useT()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  // Deep links arrive as lowercase slugs (?type=restaurant|pandals|events…);
  // normalize so every entry point lands on the right pill.
  const [type, setType] = useState<'All' | 'Pandals' | 'Restaurants' | 'Events'>(() => {
    const raw = (params.get('type') ?? '').toLowerCase().replace(/s$/, '')
    if (raw === 'restaurant') return 'Restaurants'
    if (raw === 'pandal') return 'Pandals'
    if (raw === 'event') return 'Events'
    return 'All'
  })
  const track = useApp((s) => s.track)
  const selectedCity = useApp((s) => s.selectedCity)

  const results = useMemo(() => {
    const key = q.trim().toLowerCase()
    // City-scoped pools — a Delhi user searching "Bengal" doesn't get Kolkata
    // results unless the string actually matches. Deep-link `placeById()` from
    // a shared URL still resolves cross-city (see PandalDetail).
    const pool = places.filter((p) => p.cityId === selectedCity)
    const evPool = eventsIn(selectedCity)
    const byType =
      type === 'Pandals' ? pool.filter((p) => p.type === 'pandal')
      : type === 'Restaurants' ? pool.filter((p) => p.type === 'restaurant')
      : pool
    if (!key) return { places: type === 'Events' ? [] : byType, events: type === 'Events' || type === 'All' ? evPool : [] }
    return {
      places: byType.filter((p) =>
        `${p.name} ${p.area} ${p.cuisine ?? ''} ${p.theme ?? ''} ${p.subtitle ?? ''}`.toLowerCase().includes(key)),
      events: type !== 'Pandals' && type !== 'Restaurants'
        ? evPool.filter((e) => `${e.name} ${e.venue} ${e.category}`.toLowerCase().includes(key))
        : [],
    }
  }, [q, type, selectedCity])

  const active = Boolean(q.trim()) || type !== 'All'

  return (
    <Page>
      <h1 className="text-xl font-semibold">{t('search')}</h1>
      <div className="relative mt-3">
        <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); if (e.target.value) track({ kind: 'search', label: 'Search', sublabel: e.target.value, href: '/search', at: Date.now() }) }}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-full border border-ink/10 bg-card py-3 pl-10 pr-10 text-sm shadow-card outline-none focus:border-vermilion/50"
          aria-label="Search pandals, restaurants, events"
        />
        {q && <button aria-label="Clear" onClick={() => setQ('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-faint"><X size={15} /></button>}
      </div>

      <div className="mt-3 flex gap-2">
        {PILLS.map((p) => (
          <Chip key={p} active={type === p} onClick={() => setType(p)}>{p}</Chip>
        ))}
      </div>

      {active ? (
        <div className="mt-4 space-y-3">
          {results.places.map((p) => <PlaceCard key={p.id} place={p} />)}
          {results.events.map((e) => (
            <Card key={e.id} className="flex items-center gap-3 p-3">
              <span className="h-10 w-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${e.palette.from}, ${e.palette.to})` }} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{e.name}</p>
                <p className="text-xs text-faint">{e.date} • {e.time} • {e.venue}</p>
              </div>
              <Chip>{e.category}</Chip>
            </Card>
          ))}
          {!results.places.length && !results.events.length && (
            <div className="pt-10 text-center">
              <p className="text-sm text-faint">No matches. Try “Deshapriya”, “Bengali”, “metro”…</p>
              <button
                onClick={() => { setQ(''); setType('All') }}
                className="mt-3 rounded-full border border-vermilion/40 px-4 py-1.5 text-xs font-medium text-vermilion"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <section className="mt-5">
            <SectionHeader title={t('trending')} action={t('viewAll')} />
            <Rail>{pandalsIn(selectedCity).slice(0, 5).map((p) => <RailCard key={p.id} place={p} />)}</Rail>
          </section>
          <section className="mt-5">
            <SectionHeader title={t('popularNearby')} action={t('viewAll')} />
            <div className="flex flex-wrap gap-2">
              {[...pandalsIn(selectedCity), ...restaurantsIn(selectedCity)].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 6).map((p) => (
                <TileCard key={p.id} place={p} />
              ))}
            </div>
          </section>
        </>
      )}
    </Page>
  )
}
