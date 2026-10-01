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

// ─── Label placement ─────────────────────────────────────────────────────────
// Every station shows its name, always — so names must not collide. This is a
// deterministic pass in priority order (interchanges, then terminals, then the
// rest): each station tries ten slots (above / below / left / right, the four
// corners, and far above/below) and takes the clean one; a relaxation sweep then
// lets crowded stations re-pick against everyone's current position. When the
// cramped core still offers none, the least-bad (smallest-overlap) option wins
// — with the SVG halo stroke it reads. Pure geometry, fully unit-tested
// (metroLabels.test) — on the real network the worst residual graze is <1%.

export interface LabelPlacement {
  id: string
  /** SVG <text> baseline point. */
  anchorX: number
  anchorY: number
  /** SVG text-anchor to use at that baseline. */
  textAnchor: 'middle' | 'start' | 'end'
  size: number
  /** Collision box (top-left + size) the placement occupies. Exposed so the
      renderer and the tests share ONE source of truth for label geometry. */
  box: Rect
}

export interface Rect { x: number; y: number; w: number; h: number }

// Average glyph advance ≈ 0.6em for the UI font — good enough for collision
// boxes; the same estimator is used by the tests so they agree.
const estWidth = (name: string, size: number) => name.length * size * 0.6

const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

export function labelPlacements(map: LayoutMap): LabelPlacement[] {
  const priority = [...map.stations].sort((a, b) => {
    const rank = (s: typeof a) => (s.interchange ? 0 : s.terminal ? 1 : 2)
    return rank(a) - rank(b) || (a.id < b.id ? -1 : 1)
  })

  const placed: Rect[] = []
  const out = new Map<string, LabelPlacement>()

  const VGAP = 11  // vertical clearance from the dot
  const HGAP = 8   // horizontal clearance from the dot

  // Build every station's candidate slots up front so the greedy AND the
  // later relaxation pass score against the same geometry.
  type Cand = { anchorX: number; anchorY: number; textAnchor: LabelPlacement['textAnchor']; size: number; box: Rect }
  const candsOf = new Map<string, Cand[]>()
  const order: string[] = []

  for (const s of priority) {
    const size = s.terminal || s.interchange ? 12.5 : 10.5
    const w = estWidth(s.name, size)
    const h = size * 1.16
    // Eight candidate positions. For centred (above/below) the anchor is the
    // box's horizontal centre; for side/diagonal the anchor is the box edge
    // nearest the station, with text-anchor start/end pushing it away.
    const aboveBase = s.y - VGAP
    const belowBase = s.y + VGAP + size
    const midBase = (top: number) => top + h / 2 + size * 0.35
    const candidates: Cand[] = [
      // Straight sides first (most legible), then diagonals as escape routes.
      { anchorX: s.x, anchorY: aboveBase, textAnchor: 'middle', size, box: { x: s.x - w / 2, y: aboveBase - h, w, h } },
      { anchorX: s.x, anchorY: belowBase, textAnchor: 'middle', size, box: { x: s.x - w / 2, y: s.y + VGAP, w, h } },
      { anchorX: s.x + HGAP, anchorY: midBase(s.y - h / 2), textAnchor: 'start', size, box: { x: s.x + HGAP, y: s.y - h / 2, w, h } },
      { anchorX: s.x - HGAP, anchorY: midBase(s.y - h / 2), textAnchor: 'end', size, box: { x: s.x - HGAP - w, y: s.y - h / 2, w, h } },
      // Four true corners (offset both axes) + far vertical — real escape routes
      // for the cramped central cluster, only tried after the clean straight slots.
      { anchorX: s.x + HGAP, anchorY: aboveBase, textAnchor: 'start', size, box: { x: s.x + HGAP, y: aboveBase - h, w, h } },
      { anchorX: s.x - HGAP, anchorY: aboveBase, textAnchor: 'end', size, box: { x: s.x - HGAP - w, y: aboveBase - h, w, h } },
      { anchorX: s.x + HGAP, anchorY: belowBase, textAnchor: 'start', size, box: { x: s.x + HGAP, y: s.y + VGAP, w, h } },
      { anchorX: s.x - HGAP, anchorY: belowBase, textAnchor: 'end', size, box: { x: s.x - HGAP - w, y: s.y + VGAP, w, h } },
      { anchorX: s.x, anchorY: aboveBase - (h + VGAP), textAnchor: 'middle', size, box: { x: s.x - w / 2, y: aboveBase - h - (h + VGAP), w, h } },
      { anchorX: s.x, anchorY: belowBase + (h + VGAP), textAnchor: 'middle', size, box: { x: s.x - w / 2, y: s.y + VGAP + (h + VGAP), w, h } },
    ]
    candsOf.set(s.id, candidates)
    order.push(s.id)
  }

  const inCanvas = (r: Rect) => r.x >= 2 && r.y >= 2 && r.x + r.w <= map.width - 2 && r.y + r.h <= map.height - 2
  // A slot's penalty: overlap with everything + a heavy hit for leaving canvas
  // (so canvas-bound always wins, and among those the least-crowded is chosen).
  const OUT = 1e6

  // 1. Greedy, in priority order — each station takes the first clean slot, or
  //    the least-bad one when the dense core offers none.
  const chosen = new Map<string, number>() // station id → candidate index
  const costAgainst = (box: Rect, others: Rect[]) =>
    (inCanvas(box) ? 0 : OUT) + others.reduce((acc, q) => acc + overlapArea(box, q), 0)
  for (const s of priority) {
    const cs = candsOf.get(s.id)!
    let bestIdx = 0
    let bestCost = Infinity
    cs.forEach((cand, idx) => {
      const cost = costAgainst(cand.box, placed)
      if (cost < bestCost - 1e-9) { bestCost = cost; bestIdx = idx }
    })
    chosen.set(s.id, bestIdx)
    placed.push(cs[bestIdx].box)
  }

  // 2. Relaxation sweeps — the greedy locks early choices, so a low-priority
  //    station crowded by an interchange may sit on a bad slot. Re-examine each
  //    station against the CURRENT positions of all the others and move it to
  //    its strictly-best slot. A couple of passes settles the dense core; runs
  //    in fixed order so the result stays deterministic.
  const boxOf = (id: string) => candsOf.get(id)![chosen.get(id)!].box
  for (let pass = 0; pass < 4; pass++) {
    let moved = false
    for (const id of order) {
      const cs = candsOf.get(id)!
      const costFor = (idx: number) => {
        const box = cs[idx].box
        let c = inCanvas(box) ? 0 : OUT
        for (const other of order) {
          if (other === id) continue
          c += overlapArea(box, boxOf(other))
        }
        return c
      }
      const cur = chosen.get(id)!
      let bestIdx = cur
      let bestCost = costFor(cur)
      cs.forEach((_, idx) => {
        const c = costFor(idx)
        if (c < bestCost - 1e-9) { bestCost = c; bestIdx = idx }
      })
      if (bestIdx !== cur) { chosen.set(id, bestIdx); moved = true }
    }
    if (!moved) break
  }

  for (const s of priority) {
    const cs = candsOf.get(s.id)!
    const best = cs[chosen.get(s.id)!]
    out.set(s.id, { id: s.id, anchorX: best.anchorX, anchorY: best.anchorY, textAnchor: best.textAnchor, size: best.size, box: best.box })
  }

  // Return in station-roster order (stable, matches map.stations).
  return map.stations.map((s) => out.get(s.id)!).filter(Boolean)
}
