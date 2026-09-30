import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Bell, Search as SearchIcon, Ticket, Flame, MapPin, ChevronDown } from 'lucide-react'
import { Card, EASE, Img, Page, Rail, Reveal, SectionHeader, ThemeToggle } from '../components/ui'
import { RailCard } from '../components/PlaceCard'
import { offers, pandals, restaurants, shopping, sponsored, events, walks } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { Place } from '../data/types'

export default function Home() {
  const t = useT()
  const nav = useNavigate()
  const session = useApp((s) => s.session)
  const currentAddress = useApp((s) => s.currentAddress)
  const unreadCount = useApp((s) => s.notifications.filter((n) => !n.read).length)
  const sosActive = useApp((s) => s.sosActive)
  const setSosActive = useApp((s) => s.setSosActive)

  return (
    <Page>
      {/* Persistent SOS dismiss — visible on every opening of Home until the
          user taps "I'm safe", so the flag survives a backgrounding + reopen.
          Zustand persist keeps it in localStorage across reloads. */}
      {sosActive && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 rounded-card border-2 border-red-500 bg-red-500/10 p-3"
          role="alert"
        >
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">SOS is active</p>
          <p className="mt-0.5 text-[11px] text-ink-soft">
            Your last share went out. Tap below once you're safe — the banner clears.
          </p>
          <button
            onClick={() => setSosActive(false)}
            className="mt-2 w-full rounded-full bg-red-600 py-2 text-sm font-bold text-white active:scale-95"
          >
            {t('iAmSafe')}
          </button>
        </motion.div>
      )}
      {/* Greeting — staged entrance */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex items-start justify-between"
      >
        {/* Quick-commerce style current-location header */}
        <button
          type="button"
          onClick={() => nav('/location')}
          aria-label={`${t('currentLocation')}: ${currentAddress}. ${t('chooseLocation')}`}
          className="flex min-w-0 cursor-pointer items-center gap-2 text-left active:opacity-80"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vermilion-tint text-vermilion">
            <MapPin size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-medium leading-none text-ink-soft">{t('currentLocation')}</span>
            <span className="mt-1 flex items-center gap-1 text-[15px] font-semibold leading-tight text-ink">
              <span className="truncate">{currentAddress}</span>
              <ChevronDown size={15} className="shrink-0 text-vermilion" />
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1.5 pt-1">
          <ThemeToggle />
          <motion.button
            whileTap={{ scale: 0.85, rotate: -8 }}
            onClick={() => nav('/notifications')}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            className="relative grid h-8 w-8 place-items-center text-vermilion"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <>
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-night">
                  {unreadCount}
                </span>
                <motion.span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gold"
                  animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
              </>
            )}
          </motion.button>
          <button onClick={() => nav('/profile')} aria-label="Open profile">
            <Img palette={{ from: '#8E5A2E', to: '#4A2A12' }} alt="Profile" className="h-8 w-8 rounded-full" />
          </button>
        </div>
      </motion.header>

      {/* Search */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: EASE }}
        whileTap={{ scale: 0.98 }}
        onClick={() => nav('/search')}
        className="glass animated-border mt-4 flex w-full items-center gap-2 rounded-full px-4 py-2.5 text-sm text-faint"
      >
        <SearchIcon size={16} /> {t('searchPlaceholder')}
      </motion.button>

      {/* Explore Spotlight — animated coverflow carousel */}
      <Reveal>
        <section className="mt-5">
          <SectionHeader title={t('exploreSpotlight')} action={t('viewAll')} onAction={() => nav('/explore')} />
          <SpotlightCarousel />
        </section>
      </Reveal>

      {/* Nearby Restaurants */}
      <Reveal>
        <section className="mt-2">
          <SectionHeader title={t('nearbyRestaurants')} action={t('viewAll')} onAction={() => nav('/search?type=restaurant')} />
          <Rail>
            {restaurants.slice(0, 4).map((r) => <RailCard key={r.id} place={r} />)}
          </Rail>
        </section>
      </Reveal>

      {/* Sponsored — an editorial card planted mid-feed, no label (native by design) */}
      <Reveal>
        <section className="mt-6">
          <Card className="flex items-stretch overflow-hidden">
            <Img palette={sponsored.palette} alt={sponsored.brand} className="w-24 shrink-0" />
            <div className="flex-1 p-3">
              <h3 className="mt-0.5 text-sm font-semibold">{sponsored.title}</h3>
              <p className="mt-0.5 text-xs text-ink-soft">{sponsored.description}</p>
            </div>
            <button className="my-auto mr-3 rounded-full border border-gold/60 px-3 py-1.5 text-xs font-medium text-gold transition-transform hover:scale-105 active:scale-95">
              {t('explore')}
            </button>
          </Card>
        </section>
      </Reveal>

      {/* Offers — small advertisement tablets, not product cards. Each slab is
          a single full-bleed visual with the brand + headline overlaid on a
          dark scrim and a coupon code as a tactile CTA pill. Deliberately
          no <SectionHeader> above: a hoarding on a road doesn't announce
          itself with a "deals here" caption. Tiny "Ad" tag on every slab
          keeps honesty intact (doc §58 — no native content pretending to
          be organic). */}
      <Reveal>
        <section className="mt-6">
          <Rail>
            {offers.map((o) => (
              <button
                key={o.id}
                type="button"
                aria-label={`${o.brand}: ${o.title}`}
                className="relative block w-64 shrink-0 overflow-hidden rounded-card text-left shadow-card transition-transform active:scale-[0.98]"
              >
                <Img palette={o.palette} alt={o.brand} className="h-40">
                  <div className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-transparent" />
                  <span className="absolute left-2 top-2 rounded-full border border-white/25 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-on-image">
                    Ad
                  </span>
                  <div className="absolute inset-x-3 bottom-3">
                    <p className="text-[10px] uppercase tracking-wider text-gold-bright">{o.brand}</p>
                    <h3 className="font-display mt-0.5 line-clamp-2 text-[17px] leading-tight text-on-image [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                      {o.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[11px] text-on-image/85">{o.description}</p>
                    {o.code && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-vermilion">
                        <Ticket size={11} />
                        <span className="font-mono tracking-wider">{o.code}</span>
                      </span>
                    )}
                  </div>
                </Img>
              </button>
            ))}
          </Rail>
        </section>
      </Reveal>

      {/* Events / local experiences — the off-season bridge (doc §36) */}
      <Reveal>
        <section className="mt-5">
          <SectionHeader title={t('events')} action={t('viewAll')} onAction={() => nav('/beyond-puja')} />
          <Rail>
            {events.map((e) => (
              <Card key={e.id} className="flex w-56 shrink-0 flex-col">
                <Img palette={e.palette} alt={e.name} className="h-20 shrink-0">
                  <span className="absolute right-2 top-2 rounded-full bg-night/70 px-2 py-0.5 text-[10px] text-on-image">
                    <Flame size={10} className="mr-1 inline text-gold-bright" />{e.category}
                  </span>
                </Img>
                <div className="flex-1 p-2.5">
                  <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">{e.name}</h3>
                  <p className="mt-0.5 text-[11px] text-ink-soft">{e.date} • {e.time}</p>
                  <p className="truncate text-[11px] text-faint">{e.venue}</p>
                </div>
              </Card>
            ))}
          </Rail>
        </section>
      </Reveal>

      {/* Shopping — best-selling Durga Puja sale picks from Kolkata malls.
          Currently demo (`shopping` in data/demo.ts); production replaces it
          with an aggregated feed from mall partners (online + in-store). */}
      <Reveal>
        <section className="mt-5">
          <SectionHeader title={t('shopping')} />
          <p className="-mt-1 mb-2 text-xs text-ink-soft">{t('shoppingSub')}</p>
          <Rail>
            {shopping.map((s) => (
              <Card key={s.id} className="flex w-44 shrink-0 flex-col">
                <Img palette={s.palette} alt={s.name} className="h-28 shrink-0">
                  <span className="absolute left-2 top-2 rounded-full bg-gold-bright px-1.5 py-0.5 text-[10px] font-bold text-night">
                    −{s.discountPct}%
                  </span>
                  {s.tag && (
                    <span className="absolute right-2 top-2 rounded-full bg-night/70 px-1.5 py-0.5 text-[9px] font-medium text-gold-bright">
                      {s.tag}
                    </span>
                  )}
                </Img>
                <div className="flex-1 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-faint">{s.mall}</p>
                  <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">{s.name}</h3>
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-ink">
                      ₹{s.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-faint line-through">
                      ₹{s.originalPrice.toLocaleString('en-IN')}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-faint">{s.area}</p>
                </div>
              </Card>
            ))}
          </Rail>
        </section>
      </Reveal>

      {/* Curated walks — themed pandal trails (photography, food, family).
          Tapping a card opens /walks where the full stop-by-stop itinerary is
          shown with an "Add to Planner" CTA that pre-loads that walk. */}
      <Reveal>
        <section className="mt-5">
          <SectionHeader title={t('walks')} action={t('viewAll')} onAction={() => nav('/walks')} />
          <Rail>
            {walks.map((w) => (
              <button key={w.id} onClick={() => nav('/walks')} className="w-56 shrink-0 text-left">
                <Card className="overflow-hidden p-0">
                  <Img palette={w.palette} alt={w.title} className="h-24 w-full" />
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wide text-faint">{w.stops.length} stops · {Math.round(w.totalDurationMin / 60 * 10) / 10} h</p>
                    <h3 className="mt-0.5 text-sm font-semibold leading-snug">{w.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[11px] text-faint">{w.description}</p>
                  </div>
                </Card>
              </button>
            ))}
          </Rail>
        </section>
      </Reveal>

      {/* Continue where you left off (doc §6) */}
      {session && (
        <Reveal>
          <section className="mt-5">
            <SectionHeader title={t('continueLeft')} />
            <Card className="p-3">
              <p className="text-xs text-ink-soft">You were exploring:</p>
              <p className="text-sm font-semibold">{session.label}</p>
              {session.sublabel && <p className="text-xs text-faint">Last viewed: {session.sublabel}</p>}
              <button
                onClick={() => nav(session.href)}
                className="mt-3 w-full rounded-full grad-brand py-2 text-sm font-medium text-white glow-vermilion transition-transform hover:scale-[1.02] active:scale-95"
              >
                {t('continueBtn')}
              </button>
            </Card>
          </section>
        </Reveal>
      )}

      {/* Trending pandals rail was removed — the Explore Spotlight coverflow
          at the top of Home already surfaces trending pandals, this second
          rail added scroll weight without adding information. */}
    </Page>
  )
}

/**
 * Explore Spotlight — a 3D coverflow carousel. One card sits front-and-centre
 * with two cards peeking from each side, partly tucked behind the main card.
 * Auto-advances on an interval with a spring transition; tap a side card to
 * bring it forward, tap the centre card to open it. Freezes under reduced motion.
 */
function SpotlightCarousel() {
  const nav = useNavigate()
  const reduce = useApp((s) => s.reduceMotion)
  const rm = useReducedMotion()
  const featured = pandals.slice(0, 6)
  const n = featured.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const dragX = useRef<number | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (reduce || rm || paused) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), 3600)
    return () => clearInterval(id)
  }, [reduce, rm, paused, n])

  const CARD = 236
  const signed = (i: number) => {
    let d = i - active
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    return d
  }
  const layout = (d: number) => {
    const sign = d > 0 ? 1 : -1
    if (d === 0) return { x: 0, scale: 1, z: 60, ry: 0, o: 1 }
    if (Math.abs(d) === 1) return { x: sign * CARD * 0.62, scale: 0.82, z: 34, ry: -sign * 22, o: 0.95 }
    if (Math.abs(d) === 2) return { x: sign * CARD * 1.08, scale: 0.64, z: 16, ry: -sign * 32, o: 0.55 }
    return { x: sign * CARD * 1.4, scale: 0.5, z: 0, ry: 0, o: 0 }
  }

  return (
    <div className="mt-1">
      <div
        className="relative h-[276px] w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        style={{ perspective: '1400px' }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => { setPaused(false); dragX.current = null }}
        onPointerDown={(e) => { dragX.current = e.clientX; moved.current = false; setPaused(true) }}
        onPointerMove={(e) => { if (dragX.current != null && Math.abs(e.clientX - dragX.current) > 8) moved.current = true }}
        onPointerUp={(e) => {
          if (dragX.current != null) {
            const dx = e.clientX - dragX.current
            if (dx < -45) setActive((a) => (a + 1) % n)
            else if (dx > 45) setActive((a) => (a - 1 + n) % n)
          }
          dragX.current = null
          setPaused(false)
        }}
      >
        {featured.map((p, i) => {
          const d = signed(i)
          const L = layout(d)
          const center = d === 0
          return (
            <motion.div
              key={p.id}
              className="absolute left-1/2 top-1/2"
              style={{ zIndex: L.z, width: CARD, marginLeft: -CARD / 2, marginTop: -128, pointerEvents: Math.abs(d) > 2 ? 'none' : 'auto' }}
              initial={false}
              animate={{ x: L.x, scale: L.scale, rotateY: L.ry, opacity: L.o }}
              transition={{ type: 'spring', stiffness: 240, damping: 26 }}
              onClick={() => { if (moved.current) return; center ? nav(`/pandal/${p.id}`) : setActive(i) }}
            >
              <SpotCard place={p} front={center} />
            </motion.div>
          )
        })}
      </div>

      {/* position dots — below the stage so cards never cover them */}
      <div className="mt-3 flex justify-center gap-1.5">
        {featured.map((p, i) => (
          <button
            key={p.id}
            aria-label={`Go to ${p.name}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-vermilion' : 'w-1.5 bg-ink/25 hover:bg-ink/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

/** Showcase card for the coverflow — real photo with a legible dark overlay. */
function SpotCard({ place, front }: { place: Place; front: boolean }) {
  const t = useT()
  return (
    <div className={`glass overflow-hidden rounded-card ${front ? 'shadow-lift' : 'shadow-card'}`}>
      <Img palette={place.palette} alt={place.name} className="grain h-64">
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/80 to-transparent p-3 pt-20">
          <div className="text-on-image [text-shadow:0_1px_10px_rgba(0,0,0,0.75)]">
            <h3 className="font-display text-lg">{place.name}</h3>
            <p className="text-xs text-on-image/90">Theme: {place.theme}</p>
            <p className="mt-1 text-xs text-on-image/90">★ {place.rating} • {place.distanceKm} km • {t('crowdModerate')}</p>
          </div>
        </div>
      </Img>
    </div>
  )
}
