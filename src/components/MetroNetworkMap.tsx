// ─── Animated Kolkata Metro network map ─────────────────────────────────────
// The full system — 5 lines, 55 stations, 3 real interchanges — drawn as an
// SVG diagram that traces itself once, line by line (a "metro train" running
// out along each route), then dots the stations as each line reaches them.
//
// Geometry is REAL (data/metroNetwork.ts, vendored from OpenStreetMap) and the
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
import { Info, Maximize2, Minimize2 } from 'lucide-react'
import { Card } from './ui'
import { useApp } from '../store'
import { polylineLength, projectNetwork, type LayoutMap } from '../lib/metroMap'
import { metroNetLines, metroNetStations, METRO_NET_ATTRIBUTION } from '../data/metroNetwork'

// Fixed diagram canvas; the SVG scales to the card via viewBox so this is
// purely the internal coordinate space (labels are laid out at these sizes).
const W = 720
const H = 640

// One-shot timeline: each line starts after the previous is nearly done.
const LINE_GAP = 0.45    // breathing room between lines
const START = 0.25

export default function MetroNetworkMap({ bn = false }: { bn?: boolean }) {
  const reduce = useApp((s) => s.reduceMotion)
  const [showAll, setShowAll] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [full, setFull] = useState(false)

  const map: LayoutMap = useMemo(
    () => projectNetwork({ lines: metroNetLines, stations: metroNetStations }, { width: W, height: H }),
    [],
  )

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
    <Card className="mt-3 overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{bn ? 'মেট্রো নেটওয়ার্ক মানচিত্র' : 'Metro network map'}</h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            {bn
              ? `${metroNetLines.length} লাইন · ${metroNetStations.length} স্টেশন · সব নাম দেখতে ট্যাপ করুন`
              : `${metroNetLines.length} lines · ${metroNetStations.length} stations · tap to show every name`}
          </p>
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          aria-pressed={showAll}
          className="shrink-0 rounded-full border border-white/50 px-3 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:text-ink dark:border-white/15"
        >
          {showAll
            ? (bn ? 'কম নাম' : 'Fewer labels')
            : (bn ? 'সব নাম' : 'All labels')}
        </button>
        {/* Full-screen viewer: on a phone the diagram scales to ~320px and the
            labels shrink away — this shows it at real size with native pan,
            and +/− zoom via CSS transform (compositor-only, no libraries). */}
        <button
          onClick={() => { setFull(true); setZoom(1) }}
          aria-label={bn ? 'বড় করে দেখুন' : 'View full screen'}
          className="shrink-0 rounded-full border border-white/50 p-1.5 text-ink-soft transition-colors hover:text-ink dark:border-white/15"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <figure
        role="img"
        aria-label={`Schematic network map of the Kolkata Metro: ${metroNetLines
          .map((l) => `${l.name} with ${l.stationIds.length} stations`)
          .join('; ')}. Interchanges: Esplanade, Kavi Subhash, Noapara.`}
        className="mt-2"
      >
        <MapSvg map={map} showAll={showAll} instant={instant} dotDelay={dotDelay} plan={plan} onTap={() => setShowAll((v) => !v)} />
      </figure>

      {/* Legend — the five operational lines. */}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        {map.lines.map((l) => (
          <li key={l.id} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
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

      {full && (
        <div className="fixed inset-0 z-50 bg-ivory/97 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={bn ? 'মেট্রো নেটওয়ার্ক মানচিত্র' : 'Metro network map'}>
          <div className="flex items-center justify-between gap-3 border-b border-white/40 px-4 py-3 dark:border-white/10">
            <span className="text-sm font-semibold">{bn ? 'মেট্রো নেটওয়ার্ক মানচিত্র' : 'Metro network map'}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(2)))} aria-label="Zoom out"
                className="rounded-full border border-white/50 px-3 py-1 text-sm font-medium text-ink-soft dark:border-white/15">−</button>
              <span className="w-10 text-center text-xs tabular-nums text-ink-soft">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(2)))} aria-label="Zoom in"
                className="rounded-full border border-white/50 px-3 py-1 text-sm font-medium text-ink-soft dark:border-white/15">+</button>
              <button onClick={() => setFull(false)} aria-label={bn ? 'বন্ধ করুন' : 'Close'}
                className="ml-1 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-on-image">
                <Minimize2 size={14} className="inline" />
              </button>
            </div>
          </div>
          <div className="h-[calc(100dvh-53px)] overflow-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
            <div style={{ width: W * zoom, height: H * zoom }}>
              {/* Viewer: fully drawn (the trace already ran behind the card),
                  every name labelled — that is the point of zooming in. */}
              <MapSvg map={map} showAll instant dotDelay={() => 0} plan={plan} />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

/** The diagram itself — shared by the card and the full-screen viewer. In the
 *  viewer everything is already drawn (instant) and every name shows. */
function MapSvg({
  map, showAll, instant, dotDelay, plan, onTap,
}: {
  map: LayoutMap
  showAll: boolean
  instant: boolean
  dotDelay: (id: string) => number
  plan: { win: Map<string, { start: number; dur: number }> }
  onTap?: () => void
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" onClick={onTap}>
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

      {/* Labels — terminals and interchanges always; everything else when
          "All labels" is on. Halo stroke keeps text legible over paths. */}
      {map.stations
        .filter((s) => showAll || s.terminal || s.interchange)
        .map((s) => (
          <text
            key={`label-${s.id}`} x={s.x} y={s.y - 11}
            textAnchor="middle" fontSize={s.terminal || s.interchange ? 12.5 : 10.5}
            fontWeight={s.terminal || s.interchange ? 600 : 400}
            fill="var(--color-ink, #221a15)"
            stroke="var(--color-card, #fff)" strokeWidth={3.5}
            style={{ paintOrder: 'stroke', vectorEffect: 'non-scaling-stroke' }}
          >
            {s.name}
          </text>
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
