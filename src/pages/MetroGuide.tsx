// ─── Metro guide (/transport/metro) ─────────────────────────────────────────
// The dedicated experience behind the Categories "Metro" tile: a schematic
// strip map per line, first/last + headway + fare reference, a searchable
// station roster, puja-week connectivity (nearest station per popular pandal),
// and an honest service-status panel.
//
// ALL timings/fares/routes are SAMPLE reference data (see data/transport.ts) —
// captioned "sample — verify on-site", the same convention as the metro
// timetable already shown on PandalDetail. Nothing here pretends to be a live
// feed; advisories only ever surface when a real authority feed provides them.
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, TrainFront, Clock, ArrowRightLeft, Search, MapPin, Info, CircleCheck,
  Map as MapIcon, ChevronRight,
} from 'lucide-react'
import { Card, Chip, CollapsibleList, Page, Reveal, SectionHeader } from '../components/ui'
import {
  metroLines, metroServiceAdvisories, metroStations, type MetroStation,
} from '../data/transport'
import { metroNetColors, metroNetStations } from '../data/metroNetwork'
import { metroETAs, pandals } from '../data/demo'
import { useApp } from '../store'

/** "Blue Line (Line 1)" → "Blue Line" — the friendly name for the resume card. */
const lineName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '')

export default function MetroGuide() {
  const nav = useNavigate()
  const bn = useApp((s) => s.lang) === 'bn'
  const track = useApp((s) => s.track)
  const flags = useApp((s) => s.featureFlags)
  const [params, setParams] = useSearchParams()
  // Resume support: a deep link from the "Continue where you left off" card
  // arrives as ?line=<id>&q=<station>, so reopening lands on the exact view the
  // user was on rather than always the first line. Validated against known ids.
  const [lineId, setLineId] = useState(() => {
    const p = params.get('line')
    return metroLines.some((l) => l.id === p) ? p! : metroLines[0].id
  })
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const line = metroLines.find((l) => l.id === lineId) ?? metroLines[0]

  const metroLabel = bn ? 'মেট্রো' : 'Metro'

  /** Record the finest focus so Home's resume card reads "Metro · Blue Line"
      (and the station once one is opened), and deep-links straight back here. */
  const trackMetro = (focusId: string, detail?: string, q?: string) => {
    const l = metroLines.find((x) => x.id === focusId) ?? metroLines[0]
    const href = `/transport/metro?line=${focusId}${q ? `&q=${encodeURIComponent(q)}` : ''}`
    track({ kind: 'category', label: metroLabel, sublabel: lineName(l.name), detail, href, at: Date.now() })
  }

  const selectLine = (id: string) => {
    setLineId(id)
    setParams({ line: id, ...(query ? { q: query } : {}) }, { replace: true })
    trackMetro(id, undefined, query || undefined)
  }

  const filteredStations = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? metroStations.filter((s) => s.name.toLowerCase().includes(q)) : metroStations
  }, [query])

  // Puja-week help: a station → pandal map built from the existing nearest-
  // pandal hints, so this page and the pandal detail pages agree on "my metro".
  const pujaLinks = useMemo(() => {
    const byId = new Map(pandals.map((p) => [p.id, p.name]))
    return metroETAs
      .flatMap((m) => m.nearestPandalIds.map((pid) => ({
        pandal: byId.get(pid) ?? pid, station: m.station, line: m.line,
      })))
      .filter((x) => x.pandal && !x.pandal.startsWith('pandal-'))
  }, [])

  // Opening directions is a clear intent — capture the station as the focus,
  // so the resume card can read "Metro · Blue Line · Howrah Station".
  const openDirections = (station: string) => {
    trackMetro(lineId, station, query || undefined)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${station} Metro Station Kolkata`)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <Page>
      <button onClick={() => nav(-1)} className="mb-1 flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink">
        <ArrowLeft size={16} /> {bn ? 'ফিরে যান' : 'Back'}
      </button>

      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400"><TrainFront size={22} /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{bn ? 'কলকাতা মেট্রো গাইড' : 'Kolkata Metro Guide'}</h1>
          <p className={`mt-0.5 text-xs text-faint ${bn ? 'bn' : ''}`}>
            {bn ? 'লাইন, সময়সূচি, ভাড়া ও পুজো-সংযোগ' : 'Lines, timings, fares and puja connectivity'}
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-faint">{bn ? 'নমুনা' : 'Sample data'}</span>
      </header>

      {/* Whole-system view lives on its own subpage — the guide just offers the
          entry point, so the diagram gets a full screen instead of a card.
          Own flag so the map can ship independently of the strip-map reference. */}
      {flags.ENABLE_METRO_MAP && (
        <button
          onClick={() => nav('/transport/metro/map')}
          className="glass mt-3 flex w-full items-center gap-3 overflow-hidden rounded-card p-4 text-left transition-transform active:scale-[0.985]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400"><MapIcon size={22} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{bn ? 'মেট্রো নেটওয়ার্ক মানচিত্র' : 'Metro network map'}</span>
            <span className={`mt-0.5 block text-xs text-ink-soft ${bn ? 'bn' : ''}`}>
              {bn
                ? `${metroNetColors.length} লাইন · ${metroNetStations.length} স্টেশন · অ্যানিমেটেড`
                : `${metroNetColors.length} lines · ${metroNetStations.length} stations · animated`}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-faint" aria-hidden />
        </button>
      )}

      {/* Line selector — colour-coded chips. */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {metroLines.map((l) => (
          <button
            key={l.id}
            onClick={() => selectLine(l.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              l.id === lineId ? 'border-transparent bg-ink text-on-image' : 'border-white/50 bg-card/60 text-ink-soft backdrop-blur-md dark:border-white/15 dark:bg-white/10'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} aria-hidden />
            {l.short}
          </button>
        ))}
      </div>

      {/* Selected line: strip diagram + reference stats. */}
      <Reveal>
        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold" style={{ color: line.color }}>{line.name}</p>
              <p className="text-[11px] text-faint">{line.terminals[0]} ↔ {line.terminals[1]}</p>
            </div>
            <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink tabular-nums">{line.stations.length} stations</span>
          </div>

          {/* Horizontal strip map — station pills along the line colour. */}
          <div className="no-scrollbar mt-4 flex items-center overflow-x-auto pb-1">
            {line.stations.map((s, i) => {
              const interchange = line.interchange.includes(s)
              return (
                <div key={`${s}-${i}`} className="flex shrink-0 items-center">
                  <div className="flex flex-col items-center gap-1 px-1" style={{ minWidth: 60 }}>
                    <span
                      className={`h-3 w-3 rounded-full ring-2 ring-white dark:ring-[#1a1030] ${interchange ? '!h-3.5 !w-3.5' : ''}`}
                      style={{ background: interchange ? '#fff' : line.color, boxShadow: `0 0 0 2px ${line.color}` }}
                      aria-hidden
                    />
                    <span className={`whitespace-nowrap text-[10px] ${interchange ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{s}</span>
                    {interchange && <ArrowRightLeft size={9} className="text-faint" aria-label="Interchange" />}
                  </div>
                  {i < line.stations.length - 1 && <span className="h-[3px] w-6 shrink-0 rounded-full" style={{ background: line.color }} aria-hidden />}
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat icon={<Clock size={14} />} label={bn ? 'প্ৰথম' : 'First'} value={line.firstTrain} />
            <Stat icon={<Clock size={14} />} label={bn ? 'শেষ' : 'Last'} value={line.lastTrain} />
            <Stat icon={<TrainFront size={14} />} label={bn ? 'ভাড়া (₹)' : 'Fare (₹)'} value={`₹${line.fareRange[0]}–₹${line.fareRange[1]}`} />
          </div>
          <p className="mt-2 text-[11px] text-faint">Every ~{line.headwayMin} min · {line.note}</p>
        </Card>
      </Reveal>

      {/* Service status — honest. Never fabricates a closure. */}
      <Reveal>
        <section className="mt-5">
          <SectionHeader title={bn ? 'সেবা পরিস্থিতি' : 'Service status'} />
          {metroServiceAdvisories.length === 0 ? (
            <Card className="flex items-start gap-2.5 p-3.5">
              <CircleCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <p className="text-sm text-ink-soft">
                {bn ? 'কোনো ব্যাঘাতের তথ্য নেই। এটি অফলাইন নমুনা — স্টেশনে বা অফিসাল সূত্রে যাচাই করুন।'
                  : 'No disruptions on record in this offline sample. There is no live feed connected, so this is not a statement about real-time service — check the station or an official source before travelling.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {metroServiceAdvisories.map((a, i) => (
                <Card key={i} className="flex items-start gap-2.5 border border-amber-300/50 bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                  <Info size={16} className="mt-0.5 shrink-0 text-amber-600" /> {a.text}
                </Card>
              ))}
            </div>
          )}
        </section>
      </Reveal>

      {/* All lines at a glance. */}
      <Reveal>
        <section className="mt-5">
          <SectionHeader title={bn ? 'সব লাইন' : 'All lines'} />
          <div className="space-y-2">
            {metroLines.map((l) => (
              <button key={l.id} onClick={() => selectLine(l.id)} className="w-full text-left">
                <Card className={`flex items-center gap-3 p-3 transition-transform hover:scale-[1.01] ${l.id === lineId ? 'ring-1 ring-ink/20' : ''}`}>
                  <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: l.color }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.name}</p>
                    <p className="truncate text-[11px] text-faint">{l.terminals[0]} ↔ {l.terminals[1]} · {l.stations.length} stns</p>
                  </div>
                  <span className="shrink-0 text-right text-[11px] text-ink-soft tabular-nums">
                    {l.firstTrain}<br />{l.lastTrain}
                  </span>
                </Card>
              </button>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Station roster with search + directions. */}
      <Reveal>
        <section className="mt-5">
          <SectionHeader title={`${bn ? 'স্টেশন' : 'Stations'} · ${metroStations.length}`} />
          <div className="glass mb-2 flex items-center gap-2 rounded-full px-3 py-2">
            <Search size={15} className="text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={bn ? 'স্টেশন খুঁজুন…' : 'Search stations…'}
              className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
              aria-label="Search metro stations"
            />
          </div>
          <div className="space-y-1.5">
            <CollapsibleList
              items={filteredStations}
              preview={6}
              renderItem={(s) => <StationRow key={s.name} s={s} onGo={() => openDirections(s.name)} />}
              expandLabel={(total) => (bn ? `সব ${total}টি স্টেশন দেখুন` : `View all ${total} stations`)}
              collapseLabel={bn ? 'কম দেখুন' : 'Show less'}
            />
            {filteredStations.length === 0 && <p className="py-4 text-center text-sm text-faint">No station matches “{query}”.</p>}
          </div>
        </section>
      </Reveal>

      {/* Puja-week connectivity: popular pandal → nearest station. */}
      {pujaLinks.length > 0 && (
        <Reveal>
          <section className="mt-5">
            <SectionHeader title={bn ? 'পুজো-সংযোগ' : 'Puja connectivity'} />
            <div className="space-y-2">
              {pujaLinks.map((x, i) => (
                <Card key={i} className="flex items-center gap-3 p-3">
                  <MapPin size={15} className="shrink-0 text-vermilion" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{x.pandal}</p>
                    <p className="truncate text-[11px] text-faint">{x.station} · {x.line}</p>
                  </div>
                  <Chip onClick={() => openDirections(x.station)} className="shrink-0">{bn ? 'পথ' : 'Directions'}</Chip>
                </Card>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-faint">
        {bn ? 'এই সব তথ্য নমুনা। প্রকৃত সময়সূচি ও ভাড়া অফিসাল সূত্রে যাচাই করুন।'
          : 'Schematic, timings, fares and station lists here are representative sample data for the demo. They are not sourced from a live transit feed — always verify on-site or with an official Kolkata Metro source before you travel.'}
      </p>
    </Page>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ivory-deep px-2 py-2">
      <span className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-faint">{icon}{label}</span>
      <span className="mt-0.5 block text-xs font-semibold text-ink tabular-nums">{value}</span>
    </div>
  )
}

function StationRow({ s, onGo }: { s: MetroStation; onGo: () => void }) {
  return (
    <Card className="flex items-center gap-3 p-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{s.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {s.lines.map((id) => {
            const l = metroLines.find((x) => x.id === id)
            return l ? (
              <span key={id} className="flex items-center gap-1 rounded-full bg-ivory-deep px-1.5 py-0.5 text-[10px] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} aria-hidden />{l.short}
              </span>
            ) : null
          })}
          {s.interchange && <span className="flex items-center gap-0.5 text-[10px] font-medium text-vermilion"><ArrowRightLeft size={9} /> Interchange</span>}
        </div>
      </div>
      <button onClick={onGo} aria-label={`Directions to ${s.name}`} className="shrink-0 rounded-full border border-vermilion/40 p-1.5 text-vermilion">
        <MapPin size={13} />
      </button>
    </Card>
  )
}
