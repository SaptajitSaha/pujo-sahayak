import { describe, it, expect } from 'vitest'
import { labelPlacements, projectNetwork, METRO_MAP_CANVAS, type Rect } from './metroMap'
import { metroNetLines, metroNetStations } from '../data/metroNetwork'

const map = projectNetwork({ lines: metroNetLines, stations: metroNetStations }, METRO_MAP_CANVAS)
const places = labelPlacements(map)

// Each placement carries its own collision box (single source of truth — the
// renderer draws text at the anchor, the layout reserves the box).
const rectOf = (id: string): Rect => places.find((x) => x.id === id)!.box
const intersectArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

describe('labelPlacements', () => {
  it('labels every station exactly once', () => {
    expect(places).toHaveLength(map.stations.length)
    expect(new Set(places.map((p) => p.id)).size).toBe(map.stations.length)
    for (const s of map.stations) expect(places.some((p) => p.id === s.id)).toBe(true)
  })

  it('gives bigger text to terminals and interchanges', () => {
    for (const s of map.stations) {
      const p = places.find((x) => x.id === s.id)!
      expect(p.size).toBe((s.terminal || s.interchange) ? 12.5 : 10.5)
    }
  })

  it('keeps every label box inside the canvas', () => {
    for (const s of map.stations) {
      const r = rectOf(s.id)
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(map.width)
      expect(r.y + r.h).toBeLessThanOrEqual(map.height)
    }
  })

  it('avoids label-on-label collisions: no two text boxes overlap materially', () => {
    // Greedy priority placement + relaxation sweeps, with straight / corner /
    // far-vertical escape slots, at the shared canvas size. Across the full
    // official network (~90 stations) this is zero box-on-box overlap; the bar
    // keeps a little tolerance for the width estimator against real font metrics.
    for (let i = 0; i < places.length; i++) {
      for (let j = i + 1; j < places.length; j++) {
        const a = rectOf(places[i].id)
        const b = rectOf(places[j].id)
        const overlap = intersectArea(a, b)
        const threshold = 0.02 * Math.min(a.w * a.h, b.w * b.h)
        expect(overlap, `${places[i].id} vs ${places[j].id}`).toBeLessThanOrEqual(threshold)
      }
    }
  })

  it('is deterministic: same network, same placement', () => {
    const again = labelPlacements(map)
    expect(again).toEqual(places)
  })
})
