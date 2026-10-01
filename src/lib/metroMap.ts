// ─── Kolkata Metro · map layout ──────────────────────────────────────────────
// Pure, deterministic projection of the vendored network (data/metroNetwork.ts)
// into SVG coordinates. No React, no DOM — the MetroNetworkMap component only
// draws what this returns, so the geometry is fully unit-tested (metroMap.test).
//
// Projection: equirectangular with a cos(mid-latitude) correction on longitude,
// so east–west distances shrink realistically like the ground; screen y grows
// southward (north is up). The whole network is then aspect-fit into the
// requested canvas with padding — the map never distorts or overflows.

import type { MetroNetLine, MetroNetStation } from '../data/metroNetwork'

export interface MetroNetworkInput {
  lines: MetroNetLine[]
  stations: MetroNetStation[]
}

export interface LayoutPoint {
  id: string
  x: number
  y: number
}

export interface LayoutStation {
  id: string
  name: string
  x: number
  y: number
  /** Every line id that stops here — length ≥ 2 makes it an interchange. */
  lines: string[]
  interchange: boolean
  /** An endpoint of at least one line (terminals get labels by default). */
  terminal: boolean
}

export interface LayoutLine {
  id: string
  name: string
  short: string
  color: string
  /** SVG path `d` for the whole line, straight segments in travel order. */
  d: string
  /** Station points in travel order (for dots, animation, hit-testing). */
  points: LayoutPoint[]
}

export interface LayoutMap {
  width: number
  height: number
  lines: LayoutLine[]
  stations: LayoutStation[]
}

const round = (n: number) => Math.round(n * 10) / 10

/** Total geometric length of a polyline — pure, DOM-free. The map component
    needs each line's exact stroke-dasharray BEFORE first paint to mount the
    draw-in already hidden (getTotalLength() arrives one effect too late). */
export function polylineLength(points: ReadonlyArray<{ x: number; y: number }>): number {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return len
}

/**
 * Project the network into a `width × height` viewBox (0 0 width height).
 * `padding` keeps station dots and labels off the very edge.
 */
export function projectNetwork(
  input: MetroNetworkInput,
  canvas: { width: number; height: number },
  padding = 34,
): LayoutMap {
  const { width, height } = canvas

  // cos(mid-lat) longitude squeeze — the network spans ~0.35° of latitude,
  // so a single mid-latitude factor is plenty accurate for a schematic.
  const lats = input.stations.map((s) => s.lat)
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const kx = Math.cos((midLat * Math.PI) / 180)

  // Raw projected space: x = lng·kx (east→right), y = −lat (north→up).
  const raw = input.stations.map((s) => ({ id: s.id, x: s.lng * kx, y: -s.lat }))
  const xs = raw.map((p) => p.x)
  const ys = raw.map((p) => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)

  // Aspect-fit the network bounding box into the padded canvas.
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1
  const scale = Math.min((width - 2 * padding) / spanX, (height - 2 * padding) / spanY)
  // Centre the shorter axis so the diagram sits in the middle.
  const offX = (width - spanX * scale) / 2
  const offY = (height - spanY * scale) / 2

  const pos = new Map<string, { x: number; y: number }>()
  for (const p of raw) {
    pos.set(p.id, {
      x: round(offX + (p.x - minX) * scale),
      y: round(offY + (p.y - minY) * scale),
    })
  }

  // Which lines serve each station, and which stations end a line.
  const linesAt = new Map<string, string[]>()
  const terminals = new Set<string>()
  for (const l of input.lines) {
    for (const id of l.stationIds) {
      linesAt.set(id, [...(linesAt.get(id) ?? []), l.id])
    }
    terminals.add(l.stationIds[0])
    terminals.add(l.stationIds[l.stationIds.length - 1])
  }

  const stations: LayoutStation[] = input.stations.map((s) => {
    const p = pos.get(s.id)!
    const lines = (linesAt.get(s.id) ?? []).slice().sort()
    return {
      id: s.id,
      name: s.name,
      x: p.x,
      y: p.y,
      lines,
      interchange: lines.length >= 2,
      terminal: terminals.has(s.id),
    }
  })

  const layoutLines: LayoutLine[] = input.lines.map((l) => {
    const points: LayoutPoint[] = l.stationIds.map((id) => {
      const p = pos.get(id)
      if (!p) throw new Error(`metroMap: line ${l.id} references unknown station ${id}`)
      return { id, x: p.x, y: p.y }
    })
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ')
    return { id: l.id, name: l.name, short: l.short, color: l.color, d, points }
  })

  return { width, height, lines: layoutLines, stations }
}
