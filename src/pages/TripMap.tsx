import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Navigation } from 'lucide-react'
import { Button, Card, Img, Page } from '../components/ui'
import { placeById } from '../data/demo'
import MapView from '../components/MapView'
import { useApp } from '../store'
import { haversineKm } from '../lib/geo'
import { useT } from '../i18n'
import type { PlanDay } from '../data/types'

const fmt = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function TripMap() {
  const { day = 'saptami' } = useParams()
  const t = useT()
  const nav = useNavigate()
  const planner = useApp((s) => s.planner)
  const stops = planner[(day as PlanDay) in planner ? (day as PlanDay) : 'saptami']

  const places = useMemo(
    () => stops.map((s) => ({ stop: s, place: placeById(s.placeId) })).filter((x) => x.place),
    [stops],
  )

  const { totalKm, totalMin } = useMemo(() => {
    let km = 0
    for (let i = 1; i < places.length; i++) {
      km += haversineKm(places[i - 1].place!.lat, places[i - 1].place!.lng, places[i].place!.lat, places[i].place!.lng)
    }
    const dwell = places.reduce((acc, x) => acc + x.stop.durationMin, 0)
    // city pace estimate ~15 km/h door to door during puja traffic — an estimate, labelled as such
    return { totalKm: km, totalMin: Math.round(km * 4) + dwell }
  }, [places])

  if (!places.length) {
    return (
      <Page>
        <h1 className="text-lg font-semibold">Trip</h1>
        <Card className="mt-4 p-5 text-center">
          <p className="text-sm text-ink-soft">No stops planned for this day yet.</p>
          <Link to="/planner" className="mt-2 inline-block text-sm font-medium text-vermilion">Open {t('myPujaPlan')} →</Link>
        </Card>
      </Page>
    )
  }

  const openMaps = () => {
    const pts = places.map((x) => `${x.place!.lat},${x.place!.lng}`).join('/')
    window.open(`https://www.google.com/maps/dir/${pts}`, '_blank', 'noopener')
  }

  return (
    <Page>
      <h1 className="text-lg font-semibold capitalize">{day} · {t('myPujaPlan')}</h1>
      <MapView
        route
        points={places.map((x) => ({ lat: x.place!.lat, lng: x.place!.lng, label: x.place!.name, palette: x.place!.palette }))}
        className="mt-3 h-72"
      />

      <div className="mt-4 space-y-2">
        {places.map((x, i) => (
          <Card key={i} className="flex items-center gap-3 p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vermilion text-xs font-bold text-on-image">{i + 1}</span>
            <Img palette={x.place!.palette} alt={x.place!.name} className="h-10 w-10 rounded-lg" sizes="40px" />
            <button onClick={() => nav(x.place!.type === 'pandal' ? `/pandal/${x.place!.id}` : `/restaurant/${x.place!.id}`)} className="flex-1 text-left">
              <p className="text-sm font-semibold">{x.place!.name}</p>
              <p className="text-xs text-faint">{fmt(x.stop.time)} · {x.place!.area}</p>
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <Card className="p-3">
          <p className="text-[11px] text-faint">Total Distance</p>
          <p className="text-lg font-semibold">{totalKm.toFixed(1)} km</p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] text-faint">Estimated Time</p>
          <p className="text-lg font-semibold">{Math.floor(totalMin / 60)} hr {totalMin % 60} min</p>
        </Card>
      </div>
      <p className="mt-1 text-center text-[10px] text-faint">{t('suggestedRoute')} Estimates use straight-line distance.</p>

      <Button className="mt-4 w-full" onClick={openMaps}>
        <Navigation size={15} /> {t('startNav')}
      </Button>
      <p className="mt-1 text-center text-[10px] text-faint">Opens turn-by-turn directions in Google Maps.</p>
    </Page>
  )
}
