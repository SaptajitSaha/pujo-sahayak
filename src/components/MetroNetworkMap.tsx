// ─── Animated Kolkata Metro network map ─────────────────────────────────────
// The full official network — 6 lines, ~90 stations, the real interchanges —
// drawn as an SVG diagram that traces itself once, line by line (a "metro train"
// running out along each route), then dots the stations as each line reaches them.
//
// This is the map PANEL shown on its own subpage (/transport/metro/map); the
// Metro guide links to that page rather than embedding the diagram inline.
//
// Geometry is REAL core + transcribed extensions (data/metroNetwork.ts) and the
// projection is pure/tested (lib/metroMap.ts). This component only draws.
//
// Motion doctrine (see perf notes in index.css): ONE-SHOT only — everything
// animates in exactly once via transform/opacity/stroke-dashoffset (all
// compositor-friendly, no loops, no blend modes). Reduced motion (OS setting
// or Settings toggle) renders the finished map instantly.
//
// The draw-in is DOM-free: dash lengths come from lib/metroMap.polylineLength,
// computed before first paint, so each line mounts already hidden at full
// dashoffset and framer animates it to 0 — no measure-then-rerender race.
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useApp } from '../store'
import { labelPlacements, polylineLength, projectNetwork, METRO_MAP_CANVAS, type LayoutMap } from '../lib/metroMap'
import { metroNetLines, metroNetStations, metroNetColors, METRO_NET_ATTRIBUTION } from '../data/metroNetwork'

// Fixed diagram canvas (shared with the tests); the SVG scales to its container
// via viewBox, and +/− zoom scales it past the viewport for reading the labels.
const { width: W, height: H } = METRO_MAP_CANVAS

// One-shot timeline: each line starts after the previous is nearly done.
const LINE_GAP = 0.45    // breathing room between lines
const START = 0.25

export default function MetroNetworkMap({ bn = false }: { bn?: boolean }) {
  const reduce = useApp((s) => s.reduceMotion)
  const [zoom, setZoom] = useState(1)

  const map: LayoutMap = useMemo(
    () => projectNetwork({ lines: metroNetLines, stations: metroNetStations }, METRO_MAP_CANVAS),
    [],
  )

  // Every station shows its name, always — the collision-free layout decides
  // each label's position (which side of its dot) and text size up front, in
  // pure, tested geometry (lib/metroMap.labelPlacements).
  const labels = useMemo(() => {
    const byId = new Map(map.stations.map((s) => [s.id, s]))
    return labelPlacements(map).map((p) => {
      const s = byId.get(p.id)!
      return { ...p, name: s.name, bold: s.terminal || s.interchange }
    })
  }, [map])

  // Legend lists each colour once — a branch (e.g. the Purple Diamond Park
  // spur) shares its parent line's colour, so it must not add a second swatch.
  const legendLines = useMemo(() => {
    const seen = new Set<string>()
    return map.lines.filter((l) => (seen.has(l.color) ? false : (seen.add(l.color), true)))
  }, [map])

  // Per-line draw plan, computed once from pure geometry (no DOM measure):
  // longer lines trace a touch slower so every line feels the same speed.
  const plan = useMemo(() => {
    const lens = new Map(map.lines.map((l) => [l.id, polylineLength(l.points)]))
    const maxLen = Math.max(...lens.values())
    let t = START
    const win = new Map<string, { start: number; dur: number }>()
    for (const l of map.lines) {
      const dur = 0.6 + 0.55 * (lens.get(l.id)! / maxLen) // 0.6–1.15s
      win.set(l.id, { start: t, dur })
      t += dur + LINE_GAP
    }
    // Station dots land as the trace reaches them: progress along the first
    // line that serves the station, in that line's travel order.
    const at = new Map<string, number>()
    for (const l of map.lines) {
      const w = win.get(l.id)!
      const total = lens.get(l.id)! || 1
      let acc = 0
      l.points.forEach((p, i) => {
        if (i > 0) acc += Math.hypot(p.x - l.points[i - 1].x, p.y - l.points[i - 1].y)
        if (!at.has(p.id)) at.set(p.id, w.start + (acc / total) * w.dur)
      })
    }
    return { win, at, total: t }
  }, [map])

  // Reduced motion: the completed map, instantly.
  const instant = reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dotDelay = (id: string) => (instant ? 0 : plan.at.get(id) ?? 0)

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-soft">
          {bn
            ? `${metroNetColors.length} লাইন · ${metroNetStations.length} স্টেশন`
            : `${metroNetColors.length} lines · ${metroNetStations.length} stations`}
        </p>
        {/* Zoom: fit-width at 100%; +/− scales the diagram past the viewport and
            the container pans natively (compositor-only, no libraries). */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(2)))}
            aria-label={bn ? 'ছোট করুন' : 'Zoom out'}
            className="rounded-full border border-white/50 px-3 py-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink dark:border-white/15"
          >−</button>
          <span className="w-10 text-center text-xs tabular-nums text-ink-soft">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(2)))}
            aria-label={bn ? 'বড় করুন' : 'Zoom in'}
            className="rounded-full border border-white/50 px-3 py-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink dark:border-white/15"
          >+</button>
        </div>
      </div>

      <figure
        role="img"
        aria-label={`Schematic network map of the Kolkata Metro: ${metroNetLines
          .map((l) => `${l.name} with ${l.stationIds.length} stations`)
          .join('; ')}. Interchanges: Noapara, Esplanade, Kavi Subhash, Salt Lake Sector V, Biman Bandar.`}
        className="no-scrollbar mt-2 overflow-x-auto"
        style={{ touchAction: 'pan-x pan-y' }}
      >
        <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>
          <MapSvg map={map} labels={labels} instant={instant} dotDelay={dotDelay} plan={plan} />
        </div>
      </figure>

      {/* Legend — one swatch per line colour (branches share their parent's). */}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {legendLines.map((l) => (
          <li key={l.color} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} aria-hidden />
            {l.name}
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-faint">
        <Info size={12} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          {bn
            ? 'স্টেশনের বাস্তব অবস্থান থেকে এঁকে ডায়াগ্রাম-মান মানচিত্র — আনুষ্ঠানিক কলকাতা মেট্রো মানচিত্রের সঙ্গে মিলিয়ে নিন। '
            : 'Schematic rendering of real station positions — verify with the official Kolkata Metro network map. '}
          {' '}{METRO_NET_ATTRIBUTION}.
        </span>
      </p>
    </div>
  )
}

/** The diagram itself. Labels always show; their collision-free positions come
 *  pre-computed from labelPlacements, and the halo is sized in viewBox units so
 *  it scales with the diagram (matching the layout's reserved box). */
function MapSvg({
  map, labels, instant, dotDelay, plan,
}: {
  map: LayoutMap
  labels: {
    id: string; name: string; bold: boolean
    anchorX: number; anchorY: number; textAnchor: 'middle' | 'start' | 'end'; size: number
  }[]
  instant: boolean
  dotDelay: (id: string) => number
  plan: { win: Map<string, { start: number; dur: number }> }
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none">
      {/* Line casings — a faint wide halo so coloured paths read on both themes. */}
      {map.lines.map((l) => (
        <path key={`halo-${l.id}`} d={l.d} fill="none" stroke="currentColor" strokeWidth={9}
          strokeLinecap="round" strokeLinejoin="round" className="text-ink opacity-[0.06]" />
      ))}

      {/* Animated traces — each line mounts hidden (full dashoffset) and
          its offset animates to 0 once, in pure-geometry timing order. */}
      {map.lines.map((l) => (
        <TracePath key={l.id} line={l} window={plan.win.get(l.id)!} instant={instant} />
      ))}

      {/* Station dots (interchanges get a larger ring), fading in as each
          line's trace reaches them. */}
      {map.stations.map((s) => {
        const first = map.lines.find((l) => l.id === s.lines[0])!
        return s.interchange ? (
          <motion.circle
            key={s.id} cx={s.x} cy={s.y} r={7.5}
            fill="var(--color-card, #fff)" stroke="var(--color-ink, #221a15)" strokeWidth={2.5}
            initial={instant ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: dotDelay(s.id), duration: instant ? 0 : 0.3, ease: 'easeOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ) : (
          <motion.circle
            key={s.id} cx={s.x} cy={s.y} r={3.2}
            fill={first.color} stroke="var(--color-card, #fff)" strokeWidth={1.2}
            initial={instant ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: dotDelay(s.id), duration: instant ? 0 : 0.25 }}
          />
        )
      })}

      {/* Labels — EVERY station is named, always. Each label's side and size
          were chosen by the tested collision-free layout, so names read clear
          of one another; the halo stroke keeps even the dense core legible. */}
      {labels.map((l) => (
        <motion.text
          key={`label-${l.id}`} x={l.anchorX} y={l.anchorY}
          textAnchor={l.textAnchor} fontSize={l.size} fontWeight={l.bold ? 600 : 400}
          fill="var(--color-ink, #221a15)"
          stroke="var(--color-card, #fff)" strokeWidth={4}
          style={{ paintOrder: 'stroke' }}
          initial={instant ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: dotDelay(l.id), duration: instant ? 0 : 0.3 }}
        >
          {l.name}
        </motion.text>
      ))}
    </svg>
  )
}

/** One line, drawn once: stroke-dashoffset animates full → 0 over `line` colour.
 *  The dash length is pure geometry (polylineLength), known before first paint,
 *  so the path renders hidden from its very first frame. */
function TracePath({
  line, window: w, instant,
}: {
  line: LayoutMap['lines'][number]
  window: { start: number; dur: number }
  instant: boolean
}) {
  const len = polylineLength(line.points)
  return (
    <motion.path
      d={line.d}
      fill="none"
      stroke={line.color}
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeDasharray: len }}
      initial={instant ? { strokeDashoffset: 0 } : { strokeDashoffset: len }}
      animate={{ strokeDashoffset: 0 }}
      transition={{ delay: instant ? 0 : w.start, duration: instant ? 0 : w.dur, ease: [0.4, 0, 0.2, 1] }}
    />
  )
}
