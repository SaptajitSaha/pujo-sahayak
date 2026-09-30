// Real device geolocation + OpenStreetMap Nominatim geocoding.
// These are genuine browser/network APIs (no mock). Every call degrades
// gracefully: if the device or network declines, callers fall back to the
// last known / demo area rather than inventing a location.

export interface Coords { lat: number; lng: number }
export interface GeoResult { name: string; lat: number; lng: number }

/** Great-circle distance between two points in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getCurrentLocation(timeout = 9000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was denied.'
              : 'Could not fetch your current location.',
          ),
        ),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    )
  })
}

/** Trim a long "road, suburb, city, district, state, PIN" string to the useful head. */
function shorten(displayName: string, max = 3): string {
  return displayName
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max)
    .join(', ')
}

/** Turn raw Nominatim reverse-geocode JSON into a friendly "Area, City" label. */
function friendly(data: { display_name?: string; address?: Record<string, string> }): string {
  const a = data.address ?? {}
  const city = a.city || a.town || a.village || a.county
  const area = a.suburb || a.city_district || a.neighbourhood || a.road || a.quarter
  if (area && city && area !== city) return `${area}, ${city}`
  if (city) return a.state ? `${city}, ${a.state}` : city
  if (area) return area
  return data.display_name ? shorten(data.display_name) : ''
}

export async function reverseGeocode({ lat, lng }: Coords): Promise<string> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${lat}&lon=${lng}&accept-language=en&zoom=14`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Could not resolve the address.')
  const data = await res.json()
  return friendly(data) || `${lat.toFixed(3)}, ${lng.toFixed(3)}`
}

/** Fetch the readable place name for the device's current position. */
export async function describeCurrentLocation(): Promise<string> {
  const coords = await getCurrentLocation()
  return reverseGeocode(coords)
}

export async function searchLocations(query: string): Promise<GeoResult[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2` +
    `&limit=6&accept-language=en&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Location search failed.')
  const data: { display_name: string; lat: string; lon: string }[] = await res.json()
  return data.map((d) => ({ name: shorten(d.display_name, 4), lat: +d.lat, lng: +d.lon }))
}
