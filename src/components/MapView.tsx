// Leaflet map used by Explore (Map view) and Trip Map.
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { Palette } from '../data/types'
import { Img } from './ui'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

export interface MapPoint {
  lat: number
  lng: number
  label: string
  palette: Palette
}

export default function MapView({
  points, route = false, className = '', onReady,
}: { points: MapPoint[]; route?: boolean; className?: string; onReady?: (map: L.Map) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current, { zoomControl: false, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
    map.current = m
    onReady?.(m)
    return () => { m.remove(); map.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const m = map.current
    if (!m) return
    m.eachLayer((l) => { if (!(l as L.TileLayer).getTileUrl) m.removeLayer(l) })
    const bounds: [number, number][] = points.map((pt) => [pt.lat, pt.lng])
    points.forEach((pt, i) => {
      L.marker([pt.lat, pt.lng], {
        icon: route
          ? L.divIcon({
              className: '',
              html: `<div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#ff2d95,#8e5cff,#0a84ff);color:#fff;display:flex;align-items:center;justify-content:center;font:600 12px Inter;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${i + 1}</div>`,
              iconSize: [26, 26], iconAnchor: [13, 13],
            })
          : undefined,
      })
        .bindTooltip(pt.label)
        .addTo(m)
    })
    if (route && bounds.length > 1) {
      L.polyline(bounds, { color: '#2563eb', weight: 4, opacity: 0.85, dashArray: '1 8', lineCap: 'round' }).addTo(m)
    }
    if (bounds.length) m.fitBounds(bounds, { padding: [36, 36] })
  }, [points, route])

  return <div ref={el} className={`overflow-hidden rounded-card border border-ink/10 ${className}`} />
}

/** Small map thumbnail with a pin — used inside place cards. */
export function MapThumb({ palette, alt }: { palette: Palette; alt: string }) {
  return (
    <Img palette={palette} alt={alt} className="h-full w-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-25">
        <path d="M0 60 Q 30 40 55 62 T 100 55" stroke="#fff" fill="none" strokeWidth="2" />
        <path d="M20 0 Q 35 45 20 100" stroke="#fff" fill="none" strokeWidth="2" />
        <path d="M70 0 Q 60 50 78 100" stroke="#fff" fill="none" strokeWidth="2" />
      </svg>
    </Img>
  )
}
