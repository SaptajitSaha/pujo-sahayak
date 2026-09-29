import { useNavigate } from 'react-router-dom'
import {
  Landmark, UtensilsCrossed, MapPin, TrainFront, Bus, SquareParking, Shield,
  Cross, Banknote, Pill, Toilet, HandHelping,
} from 'lucide-react'
import { MayaMark, Page } from '../components/ui'
import { categories } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { CategoryDef } from '../data/types'

const ICONS: Record<string, typeof Landmark> = {
  pandal: Landmark, restaurant: UtensilsCrossed, place: MapPin,
  metro: TrainFront, bus: Bus, parking: SquareParking,
  police: Shield, hospital: Cross, atm: Banknote, pharmacy: Pill, toilet: Toilet, help: HandHelping,
}

const GROUPS: { id: CategoryDef['group']; title: string; tint: string }[] = [
  { id: 'places', title: 'Places', tint: 'bg-vermilion-tint text-vermilion' },
  { id: 'transport', title: 'Transport & Services', tint: 'bg-ivory-deep text-ink-soft' },
  { id: 'utilities', title: 'Utilities', tint: 'bg-vermilion-tint text-vermilion' },
]

export default function Categories() {
  const t = useT()
  const nav = useNavigate()
  const lang = useApp((s) => s.lang)
  const track = useApp((s) => s.track)

  const open = (c: CategoryDef) => {
    track({ kind: 'category', label: c.label, href: c.route, at: Date.now() })
    nav(c.route)
  }

  return (
    <Page>
      <h1 className="text-xl font-semibold">{t('categories')}</h1>

      {GROUPS.map((g) => (
        <section key={g.id} className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-ink-soft">{g.title}</h2>
          <div className="grid grid-cols-3 gap-2">
            {categories.filter((c) => c.group === g.id).map((c) => {
              const Icon = ICONS[c.icon] ?? MapPin
              return (
                <button
                  key={c.id}
                  onClick={() => open(c)}
                  className="flex flex-col items-center gap-2 rounded-card border border-ink/5 bg-card p-3.5 shadow-card transition-transform active:scale-[0.98]"
                >
                  <span className={`rounded-full p-2.5 ${g.tint}`}><Icon size={18} /></span>
                  <span className={`text-[11px] font-medium ${lang === 'bn' ? 'bn' : ''}`}>
                    {lang === 'bn' ? c.labelBn : c.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {/* Ask Maya — persistent obvious action (doc §13) */}
      <button
        onClick={() => nav('/maya')}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-maya-deep to-maya py-3 text-sm font-semibold text-white shadow-lift"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm"><MayaMark size={24} /></span>
        {t('askMaya')}
      </button>
    </Page>
  )
}
