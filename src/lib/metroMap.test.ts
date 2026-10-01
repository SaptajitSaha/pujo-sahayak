import { describe, it, expect } from 'vitest'
import { polylineLength, projectNetwork } from './metroMap'
import { metroNetLines, metroNetStations } from '../data/metroNetwork'

// The real vendored network (55 stations, 5 lines) projected once for the whole
// suite — every test asserts on this same deterministic layout.
const map = projectNetwork({ lines: metroNetLines, stations: metroNetStations }, { width: 800, height: 600 })

const station = (id: string) => {
  const s = map.stations.find((x) => x.id === id)
  if (!s) throw new Error(`station ${id} missing from layout`)
  return s
}
const line = (id: string) => {
  const l = map.lines.find((x) => x.id === id)
  if (!l) throw new Error(`line ${id} missing from layout`)
  return l
}

describe('projectNetwork', () => {
  it('lays every station inside the viewBox', () => {
    for (const s of map.stations) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThanOrEqual(map.width)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThanOrEqual(map.height)
    }
  })

  it('projects north above south (screen y grows downward)', () => {
    // Dakshineshwar (22.654°N) is north of Kavi Subhash (22.472°N).
    expect(station('dakshineshwar').y).toBeLessThan(station('kavi-subhash').y)
    // Salt Lake Sector V (88.429°E) is east of Howrah Maidan (88.334°E).
    expect(station('salt-lake-sector-v').x).toBeGreaterThan(station('howrah-maidan').x)
  })

  it('keeps every station of a line in travel order along the polyline', () => {
    const pts = line('blue').points
    expect(pts.map((p) => p.id)).toEqual(metroNetLines.find((l) => l.id === 'blue')!.stationIds)
  })

  it('draws one polyline command per station — no invented waypoints', () => {
    for (const l of map.lines) {
      expect(l.points).toHaveLength(metroNetLines.find((x) => x.id === l.id)!.stationIds.length)
      expect(l.d).toMatch(/^M\s/)
      expect((l.d.match(/L/g) ?? []).length).toBe(l.points.length - 1)
    }
  })

  it('marks the three real interchanges with both lines', () => {
    expect(station('esplanade').lines.sort()).toEqual(['blue', 'green'])
    expect(station('esplanade').interchange).toBe(true)
    expect(station('kavi-subhash').interchange).toBe(true)
    expect(station('noapara').interchange).toBe(true)
  })

  it('marks ordinary stations as single-line terminals where they are endpoints', () => {
    expect(station('joka').interchange).toBe(false)
    expect(station('joka').lines).toEqual(['purple'])
    expect(station('joka').terminal).toBe(true)
    expect(station('maidan').terminal).toBe(false)
  })

  it('returns the full station roster — 55 unique physical stations', () => {
    expect(map.stations).toHaveLength(55)
    expect(new Set(map.stations.map((s) => s.id)).size).toBe(55)
  })

  it('is deterministic: same input, identical layout', () => {
    const again = projectNetwork({ lines: metroNetLines, stations: metroNetStations }, { width: 800, height: 600 })
    expect(again).toEqual(map)
  })

  it('scales to the requested canvas (bigger box, wider span)', () => {
    const small = projectNetwork({ lines: metroNetLines, stations: metroNetStations }, { width: 400, height: 300 })
    expect(small.width).toBe(400)
    // East–west extremes stay ordered and proportional-ish at any size.
    const spanBig = station('salt-lake-sector-v').x - station('joka').x
    const spanSmall =
      small.stations.find((s) => s.id === 'salt-lake-sector-v')!.x -
      small.stations.find((s) => s.id === 'joka')!.x
    expect(spanSmall).toBeLessThan(spanBig)
  })
})

describe('polylineLength', () => {
  it('is the sum of segment lengths (3-4-5 right angle)', () => {
    expect(polylineLength([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 3, y: 4 + 12 },
    ])).toBeCloseTo(5 + 12)
  })
  it('is 0 for a degenerate path', () => {
    expect(polylineLength([{ x: 5, y: 5 }])).toBe(0)
    expect(polylineLength([])).toBe(0)
  })
  it('matches the drawn Blue line span — the app can compute dash length without the DOM', () => {
    // The map component needs an exact stroke-dasharray per line before the
    // first paint; if this ever drifted from the geometry the trace would
    // clip or overshoot. Two adjacent stations one padded-unit apart each.
    const blue = line('blue')
    expect(polylineLength(blue.points)).toBeGreaterThan(0)
    expect(polylineLength(blue.points)).toBeCloseTo(
      blue.points.reduce((acc, p, i) => {
        if (i === 0) return 0
        const q = blue.points[i - 1]
        return acc + Math.hypot(p.x - q.x, p.y - q.y)
      }, 0),
    )
  })
})
