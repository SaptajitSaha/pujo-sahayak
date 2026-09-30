import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Landmark, UtensilsCrossed, MapPin, TrainFront, Bus, SquareParking, Shield,
  Cross, Banknote, Pill, Toilet, HandHelping, ArrowUpRight,
} from 'lucide-react'
import { MayaMark, Page, Reveal } from '../components/ui'
import { categories } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { CategoryDef } from '../data/types'

const ICONS: Record<string, typeof Landmark> = {
  pandal: Landmark, restaurant: UtensilsCrossed, place: MapPin,
  metro: TrainFront, bus: Bus, parking: SquareParking,
  police: Shield, hospital: Cross, atm: Banknote, pharmacy: Pill, toilet: Toilet, help: HandHelping,
}

/**
 * Per-group identity, chosen as three hues far apart on the wheel so the eye
 * reads distinct lanes: Places = brand violet (vermilion), Transport = cool sky,
 * Utilities = warm gold. (Note: --color-maya/plum lives next to violet, so it's
 * reserved for the Ask Maya CTA rather than a group lane.)
 */
const GROUPS: {
  id: CategoryDef['group']; title: string; titleBn: string
  accent: string; dot: string; orb: string; bar: string
}[] = [
  {
    id: 'places', title: 'Places', titleBn: 'জায়গা',
    accent: 'text-vermilion', dot: 'bg-vermilion',
    orb: 'bg-vermilion/10 text-vermilion', bar: 'from-vermilion/60',
  },
  {
    id: 'transport', title: 'Transport & Services', titleBn: 'পরিবহন ও সেবা',
    accent: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500',
    orb: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', bar: 'from-sky-500/60',
  },
  {
    id: 'utilities', title: 'Utilities', titleBn: 'প্রয়োজনীয় সেবা',
    accent: 'text-gold', dot: 'bg-gold',
    orb: 'bg-gold/15 text-gold', bar: 'from-gold/70',
  },
]

// Mount-time stagger (same rationale as Rail: entrance belongs to mount, not
// scroll). Children share these variants; the grid container drives the clock.
const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } }
const tileVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
}

function Tile({ c, group, bn, onOpen }: {
  c: CategoryDef; group: (typeof GROUPS)[number]; bn: boolean; onOpen: () => void
}) {
  const reduce = useReducedMotion()
  const Icon = ICONS[c.icon] ?? MapPin
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={c.label}
      variants={tileVariants}
      whileHover={reduce ? undefined : { y: -3, scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22, mass: 0.6 }}
      className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-card glass p-4 text-center shadow-card outline-none focus-visible:ring-2 focus-visible:ring-vermilion/50"
    >
      {/* accent light-line along the top rim */}
      <span aria-hidden className={`pointer-events-none absolute inset-x-3 top-0 h-[2px] rounded-full bg-gradient-to-r ${group.bar} to-transparent opacity-70`} />
      <span className={`relative grid h-12 w-12 place-items-center rounded-2xl ${group.orb} ring-1 ring-inset ring-white/50 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-90 dark:ring-white/10`}>
        <Icon size={22} strokeWidth={2} />
      </span>
      <span className={`text-[12px] font-semibold leading-tight text-ink ${bn ? 'bn' : ''}`}>
        {bn ? c.labelBn : c.label}
      </span>
      <ArrowUpRight size={13} className="absolute right-2 top-2 text-faint opacity-0 transition-opacity duration-200 group-hover:opacity-70" aria-hidden />
    </motion.button>
  )
}

export default function Categories() {
  const t = useT()
  const nav = useNavigate()
  const lang = useApp((s) => s.lang)
  const track = useApp((s) => s.track)
  const reduce = useReducedMotion() || useApp((s) => s.reduceMotion)
  const bn = lang === 'bn'

  const open = (c: CategoryDef) => {
    track({ kind: 'category', label: c.label, href: c.route, at: Date.now() })
    nav(c.route)
  }

  return (
    <Page>
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('categories')}</h1>
          <p className={`mt-0.5 text-xs text-faint ${bn ? 'bn' : ''}`}>
            {bn ? 'যেকোনো কিছুর জন্য দ্রুত লিঙ্ক' : 'Quick links to everything you need'}
          </p>
        </div>
      </header>

      {GROUPS.map((g) => {
        const items = categories.filter((c) => c.group === g.id)
        if (!items.length) return null
        return (
          <section key={g.id} className="mt-6">
            <Reveal className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} />
              <h2 className={`text-sm font-semibold ${g.accent}`}>{bn ? g.titleBn : g.title}</h2>
              <span className="rounded-full bg-ivory-deep px-1.5 py-0.5 text-[10px] font-medium text-faint">{items.length}</span>
              <span className="ml-1 h-px flex-1 bg-gradient-to-r from-ink/10 to-transparent" />
            </Reveal>

            <motion.div
              className="grid grid-cols-3 gap-3"
              variants={gridVariants}
              initial={reduce ? 'show' : 'hidden'}
              animate="show"
            >
              {items.map((c) => (
                <Tile key={c.id} c={c} group={g} bn={bn} onOpen={() => open(c)} />
              ))}
            </motion.div>
          </section>
        )
      })}

      {/* Ask Maya — persistent obvious action (doc §13) */}
      <motion.button
        onClick={() => nav('/maya')}
        whileHover={reduce ? undefined : { y: -2, scale: 1.01 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-maya-deep to-maya py-3 text-sm font-semibold text-white shadow-lift"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm"><MayaMark size={24} /></span>
        {t('askMaya')}
      </motion.button>
    </Page>
  )
}
