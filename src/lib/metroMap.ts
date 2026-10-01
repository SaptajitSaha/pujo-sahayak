// ─── Kolkata Metro · map layout ──────────────────────────────────────────────
// Pure, deterministic layout of the schematic network (data/metroNetwork.ts)
// into SVG coordinates. No React, no DOM — the MetroNetworkMap component only
// draws what this returns, so the geometry is fully unit-tested (metroMap.test).
//
// The stations already carry author-chosen schematic x/y (north up, east right)
// that reproduce the SHAPE of the official diagram. This module does no
// geographic projection — it simply aspect-fits that schematic bounding box into
// the requested canvas with padding, so the map never distorts or overflows and
// the hand-authored shape is preserved exactly.

import type { MetroNetLine, MetroNetStation } from '../data/metroNetwork'

export interface MetroNetworkInput {
  lines: MetroNetLine[]
  stations: MetroNetStation[]
}

/** The diagram's internal coordinate space, shared by the renderer and the
 *  tests so they can never drift. Sized to the schematic's own bounding box
 *  (portrait, ~0.77 aspect) with enough room that all ~90 labels — plus the
 *  halo painted around each — sit clear of their neighbours (see
 *  metroLabels.test collision check). The card scales this down to a thumbnail
 *  and the full-screen viewer shows it larger, so these units are layout space,
 *  not on-screen pixels. */
export const METRO_MAP_CANVAS = { width: 1240, height: 1600 }

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
 * Fit the schematic network into a `width × height` viewBox (0 0 width height).
 * `padding` keeps station dots and labels off the very edge. Positions are the
 * author's schematic x/y — only scaled and centred, never re-projected.
 */
export function projectNetwork(
  input: MetroNetworkInput,
  canvas: { width: number; height: number },
  padding = 34,
): LayoutMap {
  const { width, height } = canvas

  // Raw schematic space is used as-is (larger y = south, so screen y already
  // grows downward). Just take the bounding box to fit.
  const xs = input.stations.map((s) => s.x)
  const ys = input.stations.map((s) => s.y)
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
  for (const s of input.stations) {
    pos.set(s.id, {
      x: round(offX + (s.x - minX) * scale),
      y: round(offY + (s.y - minY) * scale),
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
// (metroLabels.test) — at the shared canvas size the full official network
// (all ~90 stations) places with zero box-on-box overlap.

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

// Average glyph advance ≈ 0.62em and line height ≈ 1.4em for the UI font. These
// are deliberately generous (real rendered text sits around 0.6 / 1.25): a box
// that over-reserves guarantees the painted labels never touch, which the
// browser check confirmed the tight values did not. Tests share this estimator.
const estWidth = (name: string, size: number) => name.length * size * 0.62
const estHeight = (size: number) => size * 1.4

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

  // The collision box is the label's RENDERED footprint: the glyph box plus the
  // halo stroke painted around it (the component strokes every label; the halo
  // is sized in viewBox units so it scales with the diagram and is modelable
  // here). Reserving the halo — not just the bare glyphs — is what makes two
  // names' painted boxes never touch, which is what "no overlap" means to a reader.
  const HALO = 3 // ≥ half the renderer's label strokeWidth (4), with margin

  for (const s of priority) {
    const size = s.terminal || s.interchange ? 12.5 : 10.5
    const gw = estWidth(s.name, size)
    const gh = estHeight(size)
    // Candidate slots. For centred (above/below) the anchor is the glyph box's
    // horizontal centre; for side/diagonal the anchor is the edge nearest the
    // station, with text-anchor start/end pushing the text away from the dot.
    const aboveBase = s.y - VGAP
    const belowBase = s.y + VGAP + size
    const midBase = (top: number) => top + gh / 2 + size * 0.35
    // Glyph top-left → collision box, padded by the halo on every side.
    const box = (gx: number, gy: number): Rect => ({ x: gx - HALO, y: gy - HALO, w: gw + 2 * HALO, h: gh + 2 * HALO })
    const candidates: Cand[] = [
      // Straight sides first (most legible), then diagonals as escape routes.
      { anchorX: s.x, anchorY: aboveBase, textAnchor: 'middle', size, box: box(s.x - gw / 2, aboveBase - gh) },
      { anchorX: s.x, anchorY: belowBase, textAnchor: 'middle', size, box: box(s.x - gw / 2, s.y + VGAP) },
      { anchorX: s.x + HGAP, anchorY: midBase(s.y - gh / 2), textAnchor: 'start', size, box: box(s.x + HGAP, s.y - gh / 2) },
      { anchorX: s.x - HGAP, anchorY: midBase(s.y - gh / 2), textAnchor: 'end', size, box: box(s.x - HGAP - gw, s.y - gh / 2) },
      // Four true corners (offset both axes) + far vertical — real escape routes
      // for the cramped central cluster, only tried after the clean straight slots.
      { anchorX: s.x + HGAP, anchorY: aboveBase, textAnchor: 'start', size, box: box(s.x + HGAP, aboveBase - gh) },
      { anchorX: s.x - HGAP, anchorY: aboveBase, textAnchor: 'end', size, box: box(s.x - HGAP - gw, aboveBase - gh) },
      { anchorX: s.x + HGAP, anchorY: belowBase, textAnchor: 'start', size, box: box(s.x + HGAP, s.y + VGAP) },
      { anchorX: s.x - HGAP, anchorY: belowBase, textAnchor: 'end', size, box: box(s.x - HGAP - gw, s.y + VGAP) },
      { anchorX: s.x, anchorY: aboveBase - (gh + VGAP), textAnchor: 'middle', size, box: box(s.x - gw / 2, aboveBase - gh - (gh + VGAP)) },
      { anchorX: s.x, anchorY: belowBase + (gh + VGAP), textAnchor: 'middle', size, box: box(s.x - gw / 2, s.y + VGAP + (gh + VGAP)) },
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
  //    its strictly-best slot. Several passes settle the dense core; runs
  //    in fixed order so the result stays deterministic.
  const boxOf = (id: string) => candsOf.get(id)![chosen.get(id)!].box
  for (let pass = 0; pass < 8; pass++) {
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
