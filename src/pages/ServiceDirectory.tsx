// ─── Service directory (/services/:cat) ─────────────────────────────────────
// One page behind every non-Metro transport/utility tile: Bus, Parking, Police,
// Hospital, ATM, Pharmacy, Toilet, Help Desk. Metro has its own bespoke page.
// The `:cat` param selects a config from data/transport.ts; `kind` decides
// whether we render bus ROUTES or point rows. Unknown cats bounce back to
// /categories.
//
// Everything shown is STATIC SAMPLE / reference data (see data/transport.ts),
// captioned with each directory's disclaimer. No live feed is simulated and no
// real business is presented as a verified partner.
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, MapPin, Phone, Search, Info } from 'lucide-react'
import { Card, Chip, Page, Reveal } from '../components/ui'
import {
  SERVICE_DIRECTORIES, busRoutes, directoryItems,
} from '../data/transport'
import type { BusRoute, DirectoryItem, ServiceCategory } from '../data/types'
import { DEMO_USER } from '../data/demo'
import { haversineKm } from '../lib/geo'
import { useApp } from '../store'

const isCat = (x: string): x is ServiceCategory => x in SERVICE_DIRECTORIES

export default function ServiceDirectory() {
  const { cat = '' } = useParams()
  const nav = useNavigate()
  const bn = useApp((s) => s.lang) === 'bn'
  const [query, setQuery] = useState('')

  // Resolve the directory BEFORE any early return so the useMemo below is
  // always called (Rules of Hooks). Invalid cats still bounce to /categories,
  // just after the hook has run.
  const dir = isCat(cat) ? SERVICE_DIRECTORIES[cat] : null

  const q = query.trim().toLowerCase()
  const items = useMemo(() => {
    if (!dir) return []
    if (dir.kind === 'route') {
      return q ? busRoutes.filter((r) => (r.name + r.from + r.to + r.via.join(' ')).toLowerCase().includes(q)) : busRoutes
    }
    const rows = directoryItems(cat as ServiceCategory).map((it) => ({
      it,
      km: it.lat != null && it.lng != null ? haversineKm(DEMO_USER.lat, DEMO_USER.lng, it.lat, it.lng) : null,
    }))
    const filtered = q ? rows.filter((r) => (r.it.name + r.it.area + (r.it.subtitle ?? '')).toLowerCase().includes(q)) : rows
    // Nearest first where we have coordinates; uncoordinated rows keep seed order.
    return filtered.sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9))
  }, [cat, dir, q])

  if (!dir) return <Navigate to="/categories" replace />

  return (
    <Page>
      <button onClick={() => nav(-1)} className="mb-1 flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink">
        <ArrowLeft size={16} /> {bn ? 'ফিরে যান' : 'Back'}
      </button>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className={`text-xl font-semibold ${bn ? 'bn' : ''}`}>{bn ? dir.titleBn : dir.title}</h1>
          <p className="mt-0.5 text-xs text-ink-soft">{dir.blurb}</p>
        </div>
        <span className="mt-1 shrink-0 rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-faint">{bn ? 'নমুনা' : 'Sample data'}</span>
      </header>

      {dir.phoneNote && (
        <Card className="mt-3 flex items-center gap-2 border border-vermilion/25 bg-vermilion-tint p-3">
          <Phone size={15} className="text-vermilion" />
          <span className="text-sm font-semibold text-ink">{dir.phoneNote}</span>
        </Card>
      )}

      <div className="glass mt-4 flex items-center gap-2 rounded-full px-3 py-2">
        <Search size={15} className="text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={bn ? 'খুঁজুন…' : 'Filter…'}
          className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
          aria-label={`Filter ${dir.title}`}
        />
      </div>

      <Reveal>
        <div className="mt-3 space-y-2">
          {dir.kind === 'route'
            ? (items as BusRoute[]).map((r) => <RouteCard key={r.id} r={r} />)
            : (items as { it: DirectoryItem; km: number | null }[]).map(({ it, km }) => <PointCard key={it.id} it={it} km={km} />)}
          {items.length === 0 && <p className="py-6 text-center text-sm text-faint">Nothing matches “{query}”.</p>}
        </div>
      </Reveal>

      <p className="mt-5 flex items-start gap-1.5 text-[11px] leading-relaxed text-faint">
        <Info size={13} className="mt-0.5 shrink-0" /> {dir.disclaimer}
      </p>
    </Page>
  )
}

function RouteCard({ r }: { r: BusRoute }) {
  const openMap = () =>
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${r.to} Kolkata`)}`, '_blank', 'noopener,noreferrer')
  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{r.name}</p>
        <span className="shrink-0 rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-ink capitalize">{r.type}</span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-soft">
        {r.from} <ArrowRight size={13} className="text-vermilion" /> {r.to}
      </p>
      {r.via.length > 0 && (
        <p className="mt-1 truncate text-[11px] text-faint">via {r.via.join(' · ')}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint tabular-nums">
        <span className="flex items-center gap-1"><Clock size={11} />{r.firstTrip}–{r.lastTrip}</span>
        <span>Every {r.frequencyMin} min</span>
        <span>₹{r.fareINR[0]}–₹{r.fareINR[1]}</span>
        <button onClick={openMap} className="ml-auto flex items-center gap-1 rounded-full border border-vermilion/40 px-2 py-0.5 text-[10px] font-medium text-vermilion">
          <MapPin size={11} /> Directions
        </button>
      </div>
      {r.pujaNote && <p className="mt-2 rounded-lg bg-gold/10 px-2 py-1 text-[11px] text-gold-dark">🪔 {r.pujaNote}</p>}
    </Card>
  )
}

function PointCard({ it, km }: { it: DirectoryItem; km: number | null }) {
  const openDirections = () =>
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${it.name} ${it.area} Kolkata`)}`,
      '_blank', 'noopener,noreferrer',
    )
  return (
    <Card className="p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{it.name}</p>
          <p className="truncate text-[11px] text-faint">
            {it.area}
            {km != null && ` · ${km.toFixed(1)} km`}
          </p>
          {it.subtitle && <p className="mt-0.5 truncate text-[11px] text-ink-soft">{it.subtitle}</p>}
        </div>
        {it.meta && <span className="shrink-0 text-[12px] font-semibold text-ink tabular-nums">{it.meta}</span>}
      </div>

      {(it.hours || it.phone || it.tags?.length) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {it.hours && <span className="flex items-center gap-1 rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink-soft"><Clock size={10} />{it.hours}</span>}
          {it.tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        {it.phone && (
          <a href={`tel:${it.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 rounded-full bg-vermilion px-3 py-1 text-[11px] font-semibold text-white">
            <Phone size={12} /> Call
          </a>
        )}
        {(it.lat != null || it.phone == null) && (
          <Chip onClick={openDirections} className="ml-auto">Directions</Chip>
        )}
      </div>
    </Card>
  )
}
