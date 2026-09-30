import { describe, expect, it } from 'vitest'
import {
  CACHE_TTL_MS,
  fetchDayWeather,
  weatherVerdict,
  type DayWeather,
  type KV,
} from './weather'

/** Minimal in-memory KV so the tests don't need a DOM localStorage. */
function memKV(): KV & { dump: () => Record<string, string> } {
  const m = new Map<string, string>()
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => { m.set(k, v) },
    dump: () => Object.fromEntries(m),
  }
}

/** A canned Open-Meteo-ish response body. */
const body = (date: string, rain: number, tMax: number, tMin: number) => ({
  daily: {
    time: [date],
    precipitation_probability_max: [rain],
    temperature_2m_max: [tMax],
    temperature_2m_min: [tMin],
  },
})

const okFetch = (payload: unknown) => async () =>
  ({ ok: true, json: async () => payload }) as unknown as Response

const failFetch = () => async () => { throw new Error('network down') }
const notOkFetch = () => async () => ({ ok: false, status: 500 } as unknown as Response)

describe('fetchDayWeather', () => {
  it('parses a live response into DayWeather', async () => {
    const w = await fetchDayWeather('2026-10-06', { fetchFn: okFetch(body('2026-10-06', 62, 31.4, 25.1)), kv: memKV(), now: () => 1_000 })
    expect(w).toEqual({ weather: { date: '2026-10-06', rainProbMax: 62, tMax: 31.4, tMin: 25.1 }, stale: false })
  })

  it('serves a fresh cache hit without calling fetch', async () => {
    const kv = memKV()
    let called = false
    const spyFetch = async () => { called = true; return { ok: true, json: async () => body('2026-10-06', 10, 30, 24) } as unknown as Response }
    await fetchDayWeather('2026-10-06', { fetchFn: spyFetch, kv, now: () => 5_000 })
    called = false
    const second = await fetchDayWeather('2026-10-06', { fetchFn: async () => { called = true; throw new Error('should not fetch') }, kv, now: () => 5_000 + CACHE_TTL_MS - 1 })
    expect(called).toBe(false)
    expect(second.stale).toBe(false)
  })

  it('refetches once the cache goes stale', async () => {
    const kv = memKV()
    await fetchDayWeather('2026-10-06', { fetchFn: okFetch(body('2026-10-06', 10, 30, 24)), kv, now: () => 0 })
    let called = false
    await fetchDayWeather('2026-10-06', { fetchFn: async () => { called = true; return { ok: true, json: async () => body('2026-10-06', 80, 29, 24) } as unknown as Response }, kv, now: () => CACHE_TTL_MS + 1 })
    expect(called).toBe(true)
  })

  it('falls back to stale cache when the network fails after a good fetch', async () => {
    const kv = memKV()
    await fetchDayWeather('2026-10-06', { fetchFn: okFetch(body('2026-10-06', 45, 32, 26)), kv, now: () => 0 })
    // Now past TTL and offline: should return the cached weather flagged stale.
    const offline = await fetchDayWeather('2026-10-06', { fetchFn: failFetch(), kv, now: () => CACHE_TTL_MS + 10 })
    expect(offline.stale).toBe(true)
    expect(offline.weather).toEqual({ date: '2026-10-06', rainProbMax: 45, tMax: 32, tMin: 26 })
  })

  it('rejects when offline with no cache to fall back on (never invents data)', async () => {
    await expect(fetchDayWeather('2026-10-09', { fetchFn: failFetch(), kv: memKV(), now: () => 0 })).rejects.toThrow()
  })

  it('rejects on a non-ok response with no cache', async () => {
    await expect(fetchDayWeather('2026-10-09', { fetchFn: notOkFetch(), kv: memKV(), now: () => 0 })).rejects.toThrow()
  })
})

describe('weatherVerdict', () => {
  const w = (rainProbMax: number, tMax: number): DayWeather => ({ date: 'x', rainProbMax, tMax, tMin: 24 })
  it('flags heavy rain at/above 60%', () => {
    expect(weatherVerdict(w(60, 30))).toEqual({ label: 'Carry an umbrella', tone: 'rain' })
  })
  it('flags possible rain between 30 and 59%', () => {
    expect(weatherVerdict(w(30, 30)).tone).toBe('rain')
    expect(weatherVerdict(w(30, 30)).label).toBe('Watch the sky')
    expect(weatherVerdict(w(59, 30)).label).toBe('Watch the sky')
  })
  it('flags heat when dry but hot', () => {
    expect(weatherVerdict(w(10, 33))).toEqual({ label: 'Warm afternoon', tone: 'warm' })
    expect(weatherVerdict(w(0, 40)).tone).toBe('warm')
  })
  it('defaults to comfortable', () => {
    expect(weatherVerdict(w(5, 28))).toEqual({ label: 'Comfortable for hopping', tone: 'clear' })
  })
})
