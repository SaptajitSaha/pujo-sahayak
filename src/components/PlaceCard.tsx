import { useNavigate } from 'react-router-dom'
import { MapPin, Route as RouteIcon } from 'lucide-react'
import type { PlanDay, Place } from '../data/types'
import { crowdLabel, useT } from '../i18n'
import { useApp } from '../store'
import { costForTwo, formatInr } from '../lib/price'
import { Card, Chip, CrowdTag, Img, Stars } from './ui'

export function placeHref(p: Place) {
  return p.type === 'pandal' ? `/pandal/${p.id}` : `/restaurant/${p.id}`
}

/** The plan day this place is already scheduled on, if any — the Route button
    can only mean "the day's route" when the place actually has one. */
function plannedDayOf(planner: Record<PlanDay, { placeId: string }[]>, id: string): PlanDay | null {
  for (const day of Object.keys(planner) as PlanDay[]) {
    if (planner[day].some((s) => s.placeId === id)) return day
  }
  return null
}

/** Full-width directory card — the Explore list pattern from the mockups. */
export function PlaceCard({ place }: { place: Place }) {
  const t = useT()
  const nav = useNavigate()
  const planner = useApp((s) => s.planner)
  const cost = costForTwo(place)
  // A place on the plan routes to that plan day's trip map. A place that is not
  // on any plan used to be sent to /trip/saptami anyway — an empty, unrelated
  // itinerary presented as "the route" to wherever you tapped.
  const plannedDay = plannedDayOf(planner, place.id)
  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <button onClick={() => nav(placeHref(place))} className="shrink-0" aria-label={`Open ${place.name}`}>
          <Img palette={place.palette} alt={place.name} className="h-[72px] w-[72px] rounded-lg" />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => nav(placeHref(place))} className="block w-full text-left">
            <h3 className="truncate text-sm font-semibold">{place.name}</h3>
            {place.subtitle && <p className="truncate text-xs text-ink-soft">{place.subtitle}</p>}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars rating={place.rating} />
            <span className="text-xs text-faint">• {place.distanceKm} km •</span>
            {/* Approximate cost for two, derived from the seeded price band —
                the leading ≈ is what keeps it honest (doc §58). Null for
                pandals and for any place with no band on record. */}
            {cost !== null && (
              <span className="text-xs font-medium text-ink tabular-nums">
                <span className="text-faint">≈ </span>{formatInr(cost)}{' '}
                <span className="font-normal text-ink-soft">{t('forTwo')}</span>
              </span>
            )}
            {place.crowd && <CrowdTag level={place.crowd} />}
          </div>
          {place.theme && <p className="mt-0.5 truncate text-xs text-ink-soft">Theme: {place.theme}</p>}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {place.metro && <Chip className="!text-[10px]">🚇 {place.metro}</Chip>}
        {place.facilities.map((f) => (
          <Chip key={f} className="!text-[10px]">{f}</Chip>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => nav(placeHref(place))}
          className="flex-1 rounded-full border border-vermilion/40 py-1.5 text-xs font-medium text-vermilion hover:bg-vermilion-tint"
        >
          {t('viewDetails')}
        </button>
        <button
          onClick={() => plannedDay
            ? nav(`/trip/${plannedDay}`)
            : window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.area} Kolkata`)}`, '_blank', 'noopener,noreferrer')}
          className="flex flex-1 items-center justify-center gap-1 rounded-full grad-brand py-1.5 text-xs font-medium text-white"
        >
          <RouteIcon size={12} /> {plannedDay ? t('route') : 'Directions'}
        </button>
      </div>
    </Card>
  )
}

/** Compact image card for horizontal rails (restaurants, trending, nearby). */
export function RailCard({ place, width = 'w-40' }: { place: Place; width?: string }) {
  const t = useT()
  const nav = useNavigate()
  const cost = costForTwo(place)
  return (
    <button onClick={() => nav(placeHref(place))} className={`${width} flex shrink-0 text-left`}>
      <Card className="flex w-full flex-col">
        <Img palette={place.palette} alt={place.name} className="h-24 shrink-0">
          {place.crowd && (
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-night/70 px-2 py-0.5 text-[10px] text-on-image">
              {t(crowdLabel[place.crowd])}
            </span>
          )}
        </Img>
        <div className="flex-1 p-2.5">
          <h3 className="truncate text-[13px] font-semibold">{place.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-faint">
            <Stars rating={place.rating} /> • {place.distanceKm} km
          </div>
          {place.cuisine && <p className="mt-0.5 truncate text-[11px] text-ink-soft">{place.cuisine}</p>}
          {/* Own line rather than a suffix on the cuisine: appended to it, the
              string truncates inside the price and the figure is lost. */}
          {cost !== null && (
            <p className="mt-0.5 truncate text-[11px] font-medium text-ink tabular-nums">
              <span className="text-faint">≈ </span>{formatInr(cost)}{' '}
              <span className="font-normal text-ink-soft">{t('forTwo')}</span>
            </p>
          )}
          {place.theme && <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-soft">Theme: {place.theme}</p>}
        </div>
      </Card>
    </button>
  )
}

/** Small square tile — trending pandals on Search. */
export function TileCard({ place }: { place: Place }) {
  const nav = useNavigate()
  return (
    <button onClick={() => nav(placeHref(place))} className="w-[47%] shrink-0 text-left">
      <Card>
        <Img palette={place.palette} alt={place.name} className="h-24" />
        <div className="p-2">
          <h3 className="truncate text-[13px] font-semibold">{place.name}</h3>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-faint">
            <MapPin size={10} /> {place.area}
          </div>
          <div className="mt-1"><Stars rating={place.rating} /></div>
        </div>
      </Card>
    </button>
  )
}
