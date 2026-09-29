// Full-screen "drop a pin" address picker.
//
// Provider is chosen at runtime:
//   • If VITE_GOOGLE_MAPS_KEY is set → Google Maps (JS SDK + Geocoder).
//   • Otherwise                     → the free Leaflet + OpenStreetMap picker.
// This keeps the demo working with zero keys (Leaflet fallback) while letting a
// real, billed Google integration "light up" the moment a key is configured —
// nothing is faked. Reverse geocoding always degrades to raw coordinates rather
// than inventing an address.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import { X, LocateFixed, Loader2, Check } from 'lucide-react'
import { getCurrentLocation, reverseGeocode, type Coords } from '../lib/geo'
import { useT } from '../i18n'

const KOLKATA: Coords = { lat: 22.5726, lng: 88.3639 }
const COORDS_ONLY = (c: Coords) => `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`

interface PickerProps {
  initial?: Coords
  onConfirm: (address: string, coords: Coords) => void
  onClose: () => void
}

export default function MapPicker(props: PickerProps) {
  const key = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined)?.trim()
  return key ? <GoogleMapPicker {...props} apiKey={key} /> : <LeafletMapPicker {...props} />
}

/* ────────────────────────── shared chrome ────────────────────────── */
function PickerShell({
  title, hint, address, loading, confirmLabel, cancelLabel, myLocationLabel, busyLabel,
  onClose, onMyLocation, onUse, locating, map,
}: {
  title: string; hint: string; address: string; loading: boolean
  confirmLabel: string; cancelLabel: string; myLocationLabel: string; busyLabel: string
  onClose: () => void; onMyLocation: () => void; onUse: () => void
  locating: boolean; map: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ivory">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <h2 className="flex-1 text-base font-semibold text-ink">{title}</h2>
        <button aria-label={cancelLabel} onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full glass text-ink active:scale-95">
          <X size={18} />
        </button>
      </div>

      <div className="relative flex-1">
        {map}
        <button
          onClick={onMyLocation}
          className="absolute bottom-4 right-4 z-[400] flex items-center gap-1.5 rounded-full grad-brand px-3.5 py-2 text-xs font-semibold text-white shadow-[0_4px_14px_rgb(139_92_246/0.45)] active:scale-95"
        >
          {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
          {locating ? busyLabel : myLocationLabel}
        </button>
      </div>

      <div className="border-t border-ink/10 p-4">
        <p className="text-[11px] text-faint">{hint}</p>
        <div className="mt-1 flex min-h-[2.5rem] items-start gap-2">
          {loading && <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-vermilion" />}
          <p className="flex-1 text-sm font-medium leading-snug text-ink">{address}</p>
        </div>
        <button
          onClick={onUse}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full grad-brand py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Check size={16} />
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────── Leaflet / OSM ────────────────────────── */
function LeafletMapPicker({ initial, onConfirm, onClose }: PickerProps) {
  const t = useT()
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const [address, setAddress] = useState(t('findingAddress'))
  const [coords, setCoords] = useState<Coords>(initial ?? KOLKATA)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [unusable, setUnusable] = useState(false)

  const resolve = (c: Coords) => {
    setCoords(c)
    setUnusable(false)
    setLoading(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      try {
        setAddress(await reverseGeocode(c))
      } catch {
        setAddress(COORDS_ONLY(c))
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  useEffect(() => {
    if (!el.current || map.current) return
    const start = initial ?? KOLKATA
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lng], 15)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)

    const pin = L.divIcon({
      className: '',
      html:
        '<div style="transform:translate(-50%,-100%);position:relative;width:0;height:0">' +
        '<svg width="34" height="44" viewBox="0 0 24 32" style="position:absolute;left:-17px;top:-42px">' +
        '<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#7c3aed" stroke="#fff" stroke-width="1.5"/>' +
        '<circle cx="12" cy="12" r="4.5" fill="#fff"/></svg></div>',
      iconSize: [0, 0],
    })
    const mk = L.marker([start.lat, start.lng], { icon: pin, draggable: true }).addTo(m)
    mk.on('dragend', () => { const p = mk.getLatLng(); resolve({ lat: p.lat, lng: p.lng }) })
    m.on('click', (e: L.LeafletMouseEvent) => { mk.setLatLng(e.latlng); resolve({ lat: e.latlng.lat, lng: e.latlng.lng }) })

    map.current = m
    marker.current = mk
    setTimeout(() => m.invalidateSize(), 60)
    resolve(start)
    return () => { m.remove(); map.current = null; window.clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToMe = async () => {
    setLocating(true)
    try {
      const c = await getCurrentLocation()
      marker.current?.setLatLng([c.lat, c.lng])
      map.current?.setView([c.lat, c.lng], 16)
      resolve(c)
    } catch {
      setAddress('Could not get your GPS fix — move the pin manually.')
      setUnusable(true)
      setLoading(false)
    } finally {
      setLocating(false)
    }
  }

  return (
    <PickerShell
      title={t('chooseOnMap')}
      hint={t('dropPinHint')}
      address={address}
      loading={loading}
      locating={locating}
      confirmLabel={t('useThisAddress')}
      cancelLabel="Close map"
      myLocationLabel={t('myLocationShort')}
      busyLabel={t('detecting')}
      onClose={onClose}
      onMyLocation={goToMe}
      onUse={() => { if (!loading && !unusable) onConfirm(address, coords) }}
      map={<div ref={el} className="absolute inset-0" />}
    />
  )
}

/* ────────────────────────── Google Maps ────────────────────────── */
declare global {
  interface Window { google?: any }
}
let gmapsLoader: Promise<any> | null = null
function loadGoogleMaps(apiKey: string): Promise<any> {
  const g = (window as any).google
  if (g?.maps) return Promise.resolve(g)
  if (gmapsLoader) return gmapsLoader
  gmapsLoader = new Promise((resolve, reject) => {
    const cb = '__pujo_gmaps_init__'
    ;(window as any)[cb] = () => resolve((window as any).google)
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=en&loading=async&callback=${cb}`
    s.async = true
    s.onerror = () => { gmapsLoader = null; reject(new Error('Failed to load Google Maps SDK.')) }
    document.head.appendChild(s)
  })
  return gmapsLoader
}

/** Compose a short "Area, City" label from Google's address components. */
function googleFriendly(result: any): string {
  const comps: { short_name: string; long_name: string; types: string[] }[] = result.address_components ?? []
  const get = (type: string) => comps.find((c) => c.types.includes(type))?.long_name
  const locality = get('locality') || get('sublocality_level_1') || get('postal_town')
  const area = get('sublocality') || get('neighborhood') || get('route')
  if (area && locality && area !== locality) return `${area}, ${locality}`
  return get('formatted_address') || locality || area || ''
}

function GoogleMapPicker({ initial, onConfirm, onClose, apiKey }: PickerProps & { apiKey: string }) {
  const t = useT()
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const marker = useRef<any>(null)
  const geocoder = useRef<any>(null)
  const timer = useRef<number | undefined>(undefined)

  const [address, setAddress] = useState(t('findingAddress'))
  const [coords, setCoords] = useState<Coords>(initial ?? KOLKATA)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [ready, setReady] = useState(false)

  const resolve = (c: Coords) => {
    setCoords(c)
    setLoading(true)
    if (!geocoder.current) { setAddress(COORDS_ONLY(c)); setLoading(false); return }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      geocoder.current.geocode({ location: { lat: c.lat, lng: c.lng } }, (res: any[], status: string) => {
        if (status === 'OK' && res?.[0]) setAddress(googleFriendly(res[0]))
        else setAddress(COORDS_ONLY(c))
        setLoading(false)
      })
    }, 250)
  }

  useEffect(() => {
    if (!el.current || map.current) return
    let cancelled = false
    const start = initial ?? KOLKATA
    loadGoogleMaps(apiKey)
      .then((g) => {
        if (cancelled) return
        geocoder.current = new g.maps.Geocoder()
        const m = new g.maps.Map(el.current, {
          center: start,
          zoom: 15,
          clickableIcons: false,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        // Standard draggable red pin (Google's default marker glyph).
        const mk = new g.maps.Marker({ position: start, map: m, draggable: true, title: 'Selected spot' })
        mk.addListener('dragend', (e: any) => resolve({ lat: e.latlng.lat(), lng: e.latlng.lng() }))
        m.addListener('click', (e: any) => {
          if (!e.latlng) return
          mk.setPosition(e.latlng)
          resolve({ lat: e.latlng.lat(), lng: e.latlng.lng() })
        })
        map.current = m
        marker.current = mk
        setReady(true)
        resolve(start)
      })
      .catch(() => {
        if (cancelled) return
        setAddress('Google Maps failed to load — check the API key / billing / network.')
        setLoading(false)
      })
    return () => { cancelled = true; window.clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToMe = async () => {
    setLocating(true)
    try {
      const c = await getCurrentLocation()
      map.current?.setCenter(c)
      marker.current?.setPosition(c)
      resolve(c)
    } catch {
      setAddress('Could not get your GPS fix — move the pin manually.')
      setLoading(false)
    } finally {
      setLocating(false)
    }
  }

  return (
    <PickerShell
      title={t('chooseOnMap')}
      hint={t('dropPinHint')}
      address={address}
      loading={loading && ready}
      locating={locating}
      confirmLabel={t('useThisAddress')}
      cancelLabel="Close map"
      myLocationLabel={t('myLocationShort')}
      busyLabel={t('detecting')}
      onClose={onClose}
      onMyLocation={goToMe}
      onUse={() => { if (!loading && ready) onConfirm(address, coords) }}
      map={<div ref={el} className="absolute inset-0" />}
    />
  )
}
