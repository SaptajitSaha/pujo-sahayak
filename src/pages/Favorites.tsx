import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarRange } from 'lucide-react'
import { Card, Img, Page, SectionHeader } from '../components/ui'
import { PlaceCard, RailCard } from '../components/PlaceCard'
import { pandals, placeById } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'

export default function Favorites() {
  const t = useT()
  const nav = useNavigate()
  const saved = useApp((s) => s.saved)
  const visited = useApp((s) => s.visited)

  const savedPlaces = saved.map((id) => placeById(id)).filter(Boolean)
  const visitedPlaces = visited.map((id) => placeById(id)).filter(Boolean)

  // Simple, explainable similarity: same area or same theme as what you saved.
  const mightLike = useMemo(() => {
    const mine = savedPlaces.map((p) => p!)
    if (!mine.length) return pandals.slice(0, 4)
    return pandals
      .filter((p) => !saved.includes(p.id))
      .filter((p) => mine.some((m) => m.area === p.area || (m.theme && p.theme && m.theme.toLowerCase() === p.theme.toLowerCase())))
      .slice(0, 4)
  }, [saved, visited]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page>
      <h1 className="text-xl font-semibold">{t('favorites')}</h1>

      {/* Puja Planner entry */}
      <button onClick={() => nav('/planner')} className="mt-4 w-full text-left">
        <Card className="flex items-center gap-3 p-3">
          <span className="rounded-full bg-vermilion-tint p-2.5 text-vermilion"><CalendarRange size={18} /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t('myPujaPlan')}</p>
            <p className="text-xs text-faint">Panchami → Dashami · build your route</p>
          </div>
          <span className="text-xs font-medium text-vermilion">Open ›</span>
        </Card>
      </button>

      <section className="mt-5">
        <SectionHeader title="Saved Pandals" />
        {savedPlaces.length ? (
          <div className="space-y-3">
            {savedPlaces.map((p) => p && <PlaceCard key={p.id} place={p} />)}
          </div>
        ) : (
          <EmptyHint text={`Nothing saved yet. Tap ${t('save')} on any pandal.`} onBrowse={() => nav('/explore')} />
        )}
      </section>

      <section className="mt-5">
        <SectionHeader title="Places You've Been" />
        {visitedPlaces.length ? (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
            {visitedPlaces.map((p) => p && (
              <button key={p.id} onClick={() => nav(p.type === 'pandal' ? `/pandal/${p.id}` : `/restaurant/${p.id}`)} className="w-32 shrink-0 text-left">
                <Card>
                  <Img palette={p.palette} alt={p.name} className="h-20" />
                  <p className="truncate p-2 text-xs font-medium">{p.name} ✓</p>
                </Card>
              </button>
            ))}
          </div>
        ) : (
          <EmptyHint text="Mark places as Visited to build your memory trail." onBrowse={() => nav('/explore')} />
        )}
      </section>

      <section className="mt-5">
        <SectionHeader title="You might like" />
        <p className="-mt-1 mb-2 text-[11px] text-faint">
          Based on your saved areas and themes — suggestions, not guarantees.
        </p>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          {mightLike.map((p) => <RailCard key={p.id} place={p} />)}
        </div>
      </section>
    </Page>
  )
}

function EmptyHint({ text, onBrowse }: { text: string; onBrowse: () => void }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-sm text-ink-soft">{text}</p>
      <button onClick={onBrowse} className="mt-2 text-xs font-medium text-vermilion">Browse pandals →</button>
    </Card>
  )
}
