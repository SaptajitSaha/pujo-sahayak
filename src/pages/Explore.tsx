import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, ListFilter, Map as MapIcon, MapPin } from 'lucide-react'
import { Chip, EASE, Img, Page } from '../components/ui'
import { PlaceCard } from '../components/PlaceCard'
import MapView from '../components/MapView'
import { pandals } from '../data/demo'
import { useT } from '../i18n'
import { useApp } from '../store'
import type { CrowdLevel } from '../data/types'

type Dim = 'area' | 'distance' | 'theme' | 'crowd'
const DIMS: Dim[] = ['area', 'distance', 'theme', 'crowd']

const AREAS = [...new Set(pandals.map((x) => x.area))]
const THEMES = ['Traditional', 'Heritage', 'Artistic', 'Modern']
const THEME_KEYWORDS: Record<string, string[]> = {
  Traditional: ['traditional', 'barowari', 'rustic'],
  Heritage: ['heritage', 'century', 'rajbari'],
  Artistic: ['art', 'installation', 'hand-painted', 'terracotta'],
  Modern: ['modern', 'light', 'contemporary', 'time'],
}
const DISTANCES = ['< 2 km', '2–4 km', '> 4 km']

export default function Explore() {
  const t = useT()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [view, setView] = useState<'list' | 'map'>('list')
  const [open, setOpen] = useState<Dim | null>(null)
  const [sel, setSel] = useState<Partial<Record<Dim, string>>>({ area: params.get('area') ?? undefined })
  const track = useApp((s) => s.track)

  const filtered = useMemo(() => {
    return pandals.filter((p) => {
      if (sel.area && p.area !== sel.area) return false
      if (sel.crowd && p.crowd !== (sel.crowd as CrowdLevel)) return false
      if (sel.distance) {
        if (sel.distance === '< 2 km' && p.distanceKm >= 2) return false
        if (sel.distance === '2–4 km' && (p.distanceKm < 2 || p.distanceKm > 4)) return false
        if (sel.distance === '> 4 km' && p.distanceKm <= 4) return false
      }
      if (sel.theme) {
        const hay = `${p.theme} ${p.story ?? ''}`.toLowerCase()
        const keywords = THEME_KEYWORDS[sel.theme]
        if (!keywords.some((k) => hay.includes(k))) return false
      }
      return true
    })
  }, [sel])

  const toggle = (dim: Dim, value?: string) => {
    setOpen((o) => (o === dim ? null : value === undefined ? dim : o))
    if (value !== undefined && dim) {
      setSel((s) => ({ ...s, [dim]: s[dim] === value ? undefined : value }))
      track({ kind: 'category', label: 'South Kolkata Pandals', sublabel: value, href: '/explore', at: Date.now() })
    }
  }

  const subOptions: Record<Dim, string[]> = { area: AREAS, distance: DISTANCES, theme: THEMES, crowd: ['high', 'moderate', 'low'] }

  return (
    <Page>
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Explore</h1>
        <button aria-label="Search" onClick={() => nav('/search')} className="text-vermilion">
          <Search size={20} />
        </button>
      </header>

      {/* List / Map toggle */}
      <div className="mt-3 flex rounded-full border border-ink/10 bg-card p-1 shadow-card">
        <button
          onClick={() => setView('list')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium ${view === 'list' ? 'bg-vermilion text-on-image' : 'text-ink-soft'}`}
        >
          <ListFilter size={14} /> {t('list')}
        </button>
        <button
          onClick={() => setView('map')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium ${view === 'map' ? 'bg-vermilion text-on-image' : 'text-ink-soft'}`}
        >
          <MapIcon size={14} /> {t('map')}
        </button>
      </div>

      {/* Filter chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {DIMS.map((d) => (
          <Chip key={d} active={Boolean(sel[d]) || open === d} onClick={() => toggle(d)}>
            {d[0].toUpperCase() + d.slice(1)}
            {sel[d] ? ` · ${sel[d]}` : ''}
          </Chip>
        ))}
      </div>
      {open && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {subOptions[open].map((v) => (
            <Chip key={v} active={sel[open] === v} onClick={() => { setSel((s) => ({ ...s, [open]: s[open] === v ? undefined : v })); setOpen(null) }}>
              {v}
            </Chip>
          ))}
        </div>
      )}

      {view === 'list' ? (
        <motion.div layout className="mt-4 space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.25), ease: EASE }}
              >
                <PlaceCard place={p} />
              </motion.div>
            ))}
          </AnimatePresence>
          {!filtered.length && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-10 text-center text-sm text-faint">
              No pandals match these filters.
            </motion.p>
          )}
        </motion.div>
      ) : (
        <div className="mt-4">
          <MapView
            points={filtered.map((p) => ({ lat: p.lat, lng: p.lng, label: p.name, palette: p.palette }))}
            className="h-[70vh]"
          />
          <div className="mt-3 space-y-2">
            {filtered.slice(0, 3).map((p) => (
              <button key={p.id} onClick={() => nav(`/pandal/${p.id}`)} className="flex w-full items-center gap-2 rounded-card bg-card p-2 text-sm shadow-card">
                <Img palette={p.palette} alt={p.name} className="h-9 w-9 rounded-md" />
                <span className="flex-1 text-left font-medium">{p.name}</span>
                <span className="flex items-center gap-1 text-xs text-faint"><MapPin size={11} />{p.distanceKm} km</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Page>
  )
}
