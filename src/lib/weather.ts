/**
 * Day-of weather for the Puja planner, from Open-Meteo (free, no API key,
 * CORS-friendly) — the same "honest external service" precedent as Nominatim
 * geocoding. Nothing is fabricated:
 *   - a real HTTP result is parsed straight through;
 *   - we cache it locally so offline days still show the last real reading,
 *     clearly flagged `stale`;
 *   - if there is no cache and the network fails, we throw — the UI then shows
 *     "unavailable", never an invented forecast.
 */

export interface DayWeather {
  date: string
  rainProbMax: number // % chance of precipitation, peak of the day
  tMax: number        // °C
  tMin: number        // °C
}

export interface WeatherResult { weather: DayWeather; stale: boolean }

/** Tiny storage seam so callers/tests can inject a KV store instead of DOM. */
export interface KV { get(k: string): string | null; set(k: string, v: string): void }

/** Re-use a cached reading for up to 6 h before refetching. */
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000

// Kolkata centre; the app is single-city for Tier 1.
const LAT = 22.5726
const LNG = 88.3639

function buildUrl(date: string): string {
  const p = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LNG),
    daily: 'precipitation_probability_max,temperature_2m_max,temperature_2m_min',
    timezone: 'Asia/Kolkata',
    start_date: date,
    end_date: date,
  })
  return `https://api.open-meteo.com/v1/forecast?${p.toString()}`
}

interface CacheEntry { weather: DayWeather; at: number }

function readCache(kv: KV, key: string): CacheEntry | null {
  const raw = kv.get(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CacheEntry
    if (parsed && parsed.weather && typeof parsed.at === 'number') return parsed
  } catch { /* corrupt entry -> treat as miss */ }
  return null
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function parseDaily(json: unknown, date: string): DayWeather {
  const d = (json as { daily?: Record<string, unknown[]> })?.daily
  const times = d?.time as string[] | undefined
  const idx = times && times.length ? Math.max(0, times.indexOf(date)) : 0
  const pick = (k: string) => num((d?.[k] as number[] | undefined)?.[idx])
  return {
    date,
    rainProbMax: pick('precipitation_probability_max'),
    tMax: pick('temperature_2m_max'),
    tMin: pick('temperature_2m_min'),
  }
}

export interface FetchDeps { fetchFn?: typeof fetch; kv?: KV; now?: () => number }

function defaultKV(): KV {
  if (typeof localStorage !== 'undefined') {
    return { get: (k) => localStorage.getItem(k), set: (k, v) => localStorage.setItem(k, v) }
  }
  const m = new Map<string, string>()
  return { get: (k) => m.get(k) ?? null, set: (k, v) => { m.set(k, v) } }
}

/**
 * Get the weather for one ISO date (YYYY-MM-DD), cache-aware.
 * Resolves fresh or stale data; rejects only when there is no cache and the
 * network failed / returned not-ok — so callers can honestly show "unavailable".
 */
export async function fetchDayWeather(date: string, deps: FetchDeps = {}): Promise<WeatherResult> {
  const doFetch = deps.fetchFn ?? globalThis.fetch
  const kv = deps.kv ?? defaultKV()
  const now = deps.now ? deps.now() : Date.now()
  const key = `ps-weather-${date}`
  const cached = readCache(kv, key)

  if (cached && now - cached.at < CACHE_TTL_MS) {
    return { weather: cached.weather, stale: false }
  }

  try {
    const res = await doFetch(buildUrl(date))
    if (!res.ok) throw new Error(`Weather unavailable (${res.status}).`)
    const json = await res.json()
    const weather = parseDaily(json, date)
    kv.set(key, JSON.stringify({ weather, at: now } satisfies CacheEntry))
    return { weather, stale: false }
  } catch (err) {
    if (cached) return { weather: cached.weather, stale: true }
    throw err instanceof Error ? err : new Error('Weather unavailable.')
  }
}

export type WeatherTone = 'rain' | 'warm' | 'clear'

/** A plain-language verdict for a single day — the chip's headline text. */
export function weatherVerdict(w: DayWeather): { label: string; tone: WeatherTone } {
  if (w.rainProbMax >= 60) return { label: 'Carry an umbrella', tone: 'rain' }
  if (w.rainProbMax >= 30) return { label: 'Watch the sky', tone: 'rain' }
  if (w.tMax >= 33) return { label: 'Warm afternoon', tone: 'warm' }
  return { label: 'Comfortable for hopping', tone: 'clear' }
}
