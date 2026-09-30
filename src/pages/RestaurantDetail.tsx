import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Clock, MapPin, Phone, ShoppingBag } from 'lucide-react'
import { Button, Card, Img, Lightbox, Page, Rail, SectionHeader, Stars, type LightboxItem } from '../components/ui'
import { RailCard } from '../components/PlaceCard'
import { placeById, restaurants } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'

export default function RestaurantDetail() {
  const { id = '' } = useParams()
  const t = useT()
  const nav = useNavigate()
  const place = placeById(id)
  const saved = useApp((s) => s.saved)
  const toggleSaved = useApp((s) => s.toggleSaved)
  // Dish detail lightbox — tapping a popular dish shows its full name + Bangla.
  const [zoom, setZoom] = useState<LightboxItem | null>(null)

  const others = useMemo(
    () => restaurants.filter((r) => r.id !== id).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4),
    [id],
  )

  if (!place || place.type !== 'restaurant') {
    return (
      <Page>
        <div className="flex flex-col items-center gap-3 pt-20 text-center">
          <p className="text-sm text-faint">This restaurant page doesn't exist — the link may be old or mistyped.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => nav('/search?type=restaurant')}>Find restaurants</Button>
            <Button size="sm" variant="outline" onClick={() => nav('/explore')}>Browse pandals</Button>
          </div>
        </div>
      </Page>
    )
  }
  const isSaved = saved.includes(place.id)

  return (
    <Page className="!px-0 !pt-0">
      <div className="grain relative h-52">
        <Img palette={place.palette} alt={place.name} className="absolute inset-0 h-full" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button aria-label="Go back" onClick={() => nav(-1)} className="rounded-full bg-night/50 px-3 py-1.5 text-sm text-on-image">
            ‹ Back
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/80 to-transparent p-4 pt-20 text-on-image [text-shadow:0_1px_10px_rgba(0,0,0,0.75)]">
          <h1 className="font-display text-2xl">{place.name}</h1>
          <p className="text-xs text-on-image/90">{place.cuisine} • {place.priceBand}</p>
        </div>
      </div>

      <div className="px-4">
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Stars rating={place.rating} count={place.reviewCount} />
          <span className="flex items-center gap-1 text-xs text-faint"><MapPin size={11} /> {place.distanceKm} km</span>
          <span className={`text-xs font-medium ${place.openNow ? 'text-emerald-600' : 'text-vermilion'}`}>
            {place.openNow ? 'Open now' : 'Closed now'}
          </span>
        </div>
        {place.hours && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft"><Clock size={12} /> {place.hours}</p>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant={isSaved ? 'dark' : 'outline'} size="sm" className="flex-1" onClick={() => toggleSaved(place.id)}>
            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} {isSaved ? t('saved') : t('save')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled title="Calling coming soon">
            <Phone size={14} /> Call
          </Button>
          <Button size="sm" className="flex-1" disabled title="Ordering coming soon">
            <ShoppingBag size={14} /> Order
          </Button>
        </div>
        <p className="mt-1 text-right text-[10px] text-faint">Call & ordering coming soon — no fake integration.</p>

        {place.popularDishes?.length ? (
          <section className="mt-5">
            <SectionHeader title="Popular Dishes" />
            <Rail>
              {place.popularDishes.map((d) => (
                <button key={d.id} onClick={() => setZoom({ title: d.name, sub: d.nameBn ? `«${d.nameBn}»` : undefined, palette: d.palette })} className="shrink-0 text-left">
                  <Card className="w-32 overflow-hidden transition-transform hover:scale-[1.02]">
                    <Img palette={d.palette} alt={d.name} className="h-20" />
                    <div className="p-2">
                      <p className="truncate text-xs font-semibold">{d.name}</p>
                      {d.nameBn && <p className="bn truncate text-[11px] text-faint">{d.nameBn}</p>}
                    </div>
                  </Card>
                </button>
              ))}
            </Rail>
          </section>
        ) : null}

        {place.reviews?.length ? (
          <section className="mt-5">
            <SectionHeader title={t('whatOthersSay')} />
            {place.reviews.map((r) => (
              <Card key={r.id} className="mb-2 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.author}</p>
                  <Stars rating={r.rating} />
                </div>
                <p className="mt-1 text-sm text-ink-soft">“{r.text}”</p>
              </Card>
            ))}
          </section>
        ) : null}

        <section className="mt-5">
          <SectionHeader title="More Restaurants Nearby" action={t('viewAll')} onAction={() => nav('/search?type=restaurant')} />
          <Rail>{others.map((r) => <RailCard key={r.id} place={r} />)}</Rail>
        </section>
      </div>

      <Lightbox item={zoom} onClose={() => setZoom(null)} />
    </Page>
  )
}
