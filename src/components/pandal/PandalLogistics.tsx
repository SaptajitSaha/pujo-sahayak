import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { Card, SectionHeader } from '../ui'
import { bloodBanks, metroETAs, parkingSpots } from '../../data/demo'
import { haversineKm } from '../../lib/geo'
import { useT } from '../../i18n'
import type { Place } from '../../data/types'

/** Opens an external walking/driving route for a named spot (parking ground,
    metro station). Plain Maps search URL — no key, no fake integration. */
const openDirections = (name: string, area: string) =>
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${area} Kolkata`)}`, '_blank', 'noopener,noreferrer')

/**
 * Pandal logistics — parking, metro timetable, blood banks. Sorted by
 * proximity to this pandal (haversine km) with the pandal's own id boosted to
 * the front when present in the entity's nearestPandalIds hint list. All three
 * arrays are seeded reference data — a "sample timetable / verify on-site"
 * caption keeps the honesty convention the rest of the app follows.
 */
export function PandalLogistics({ place }: { place: Place }) {
  const t = useT()

  const nearParking = useMemo(() => [...parkingSpots]
    .map((p) => ({
      p,
      km: haversineKm(place.lat, place.lng, p.lat, p.lng),
      hinted: p.nearestPandalIds.includes(place.id),
    }))
    .sort((a, b) => (b.hinted ? 1 : 0) - (a.hinted ? 1 : 0) || a.km - b.km)
    .slice(0, 3), [place])

  const nearMetro = useMemo(() => [...metroETAs]
    .map((m) => ({
      m,
      hinted: m.nearestPandalIds.includes(place.id),
    }))
    .sort((a, b) => (b.hinted ? 1 : 0) - (a.hinted ? 1 : 0))
    .slice(0, 2), [place])

  const nearBlood = useMemo(() => [...bloodBanks]
    .map((b) => ({ b, km: haversineKm(place.lat, place.lng, b.lat, b.lng) }))
    .sort((x, y) => x.km - y.km)
    .slice(0, 3), [place])

  return (
    <>
      {/* Parking — closest grounds with walk-time + rate chip. Sample data
          (capacity varies on puja evening — verify on-site). */}
      {nearParking.length > 0 && (
        <section className="mt-5">
          <SectionHeader title={t('parking')} />
          <div className="space-y-2">
            {nearParking.map(({ p, km, hinted }) => (
              <Card key={p.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-[11px] text-faint">{p.area} · {km.toFixed(1)} km · {p.walkTimeMin} min walk</p>
                </div>
                <span className="shrink-0 rounded-full bg-ivory-deep px-2 py-1 text-[10px] text-ink capitalize">
                  {p.capacityHint}
                </span>
                <span className="shrink-0 text-[11px] font-medium text-ink tabular-nums">₹{p.ratePerHour}/h</span>
                {hinted && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Serves this pandal</span>}
                <button onClick={() => openDirections(p.name, p.area)} aria-label={`Directions to ${p.name}`} className="shrink-0 rounded-full border border-vermilion/40 p-1.5 text-vermilion">
                  <MapPin size={13} />
                </button>
              </Card>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-faint">Capacity varies on puja evening — verify on-site.</p>
        </section>
      )}

      {/* Metro timetable — nearest stations with first/last train + headway.
          Static reference data, honestly labelled. */}
      {nearMetro.length > 0 && (
        <section className="mt-5">
          <SectionHeader title={t('metroTimetable')} />
          <div className="space-y-2">
            {nearMetro.map(({ m, hinted }) => (
              <Card key={m.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{m.station}</p>
                  <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink">{m.line}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-faint">
                  <span>First {m.firstTrain}</span>
                  <span>Last {m.lastTrain}</span>
                  <span>Every {m.frequencyMin} min</span>
                  {hinted && <span className="font-medium text-emerald-700">Nearest to this pandal</span>}
                  <button onClick={() => openDirections(m.station, 'Metro')} aria-label={`Directions to ${m.station} station`} className="ml-auto flex items-center gap-1 rounded-full border border-vermilion/40 px-2 py-0.5 text-[10px] font-medium text-vermilion">
                    <MapPin size={11} /> Directions
                  </button>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-faint">Timetable sample — check on-site for Puja-week special services.</p>
        </section>
      )}

      {/* Blood banks — closest 3 with available groups + phone. Emergency
          resources; kept compact so they're findable at a glance. */}
      {nearBlood.length > 0 && (
        <section className="mt-5">
          <SectionHeader title={t('bloodBanks')} />
          <div className="space-y-2">
            {nearBlood.map(({ b, km }) => (
              <Card key={b.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{b.name}</p>
                    <p className="text-[11px] text-faint">{b.hospital} · {b.area} · {km.toFixed(1)} km</p>
                  </div>
                  <a href={`tel:${b.phone.replace(/\s+/g, '')}`} className="shrink-0 rounded-full bg-vermilion px-3 py-1 text-[11px] font-semibold text-white">
                    Call
                  </a>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {b.availableGroups.map((g) => (
                    <span key={g} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">{g}</span>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-faint">{b.hours}</p>
              </Card>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-faint">Availability is illustrative — always phone before travelling.</p>
        </section>
      )}
    </>
  )
}
