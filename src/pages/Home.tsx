import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Bell, Search as SearchIcon, Ticket, Flame, MapPin, ChevronDown, ChevronRight, Calendar, BookOpen, Users, Megaphone, TrainFront, Compass, Sparkles } from 'lucide-react'
import { Avatar, Card, EASE, Img, Page, Rail, Reveal, SectionHeader, ThemeToggle } from '../components/ui'
import { RailCard } from '../components/PlaceCard'
import { TonightDashboard } from '../components/TonightDashboard'
import { WhatNextSheet } from '../components/WhatNextSheet'
import { offers, shopping, tithis, walks, eventsIn, pandalsIn, restaurantsIn, placeById, DEMO_USER } from '../data/demo'
import { suggestNext, type NextSuggestion } from '../lib/whatsnext'
import { useApp } from '../store'
import { useProducts } from '../services/marketplace'
import { productImage, productPalette } from '../services/marketplace.mock'
import { useAuthorityAlerts } from '../services/authority'
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
  const selectedCity = useApp((s) => s.selectedCity)
  const tithiDemoMode = useApp((s) => s.tithiDemoMode)
  const flags = useApp((s) => s.featureFlags)
  const planner = useApp((s) => s.planner)
  const saved = useApp((s) => s.saved)
  const saveIntents = useApp((s) => s.saveIntents)
  const visited = useApp((s) => s.visited)
  const checkins = useApp((s) => s.checkins)

  // City-aware datasets — every rail on Home scopes to the selected city.
  const cityPandals = useMemo(() => pandalsIn(selectedCity), [selectedCity])
  const cityRestaurants = useMemo(() => restaurantsIn(selectedCity), [selectedCity])
  const cityEvents = useMemo(() => eventsIn(selectedCity), [selectedCity])

  // Cross-feature data (only fetched when the flag is on). Both hooks return
  // empty without a Supabase backend, so nothing is invented on Home.
  const { data: marketProducts = [] } = useProducts(undefined, undefined)
  const { data: alerts = [] } = useAuthorityAlerts()

  // Ad slabs are on-device-interactive: tapping one copies its coupon code
  // (clipboard + toast) — the honest equivalent of "acting on" a hoarding
  // without a backend. Same pattern as the share/copy affordances elsewhere.
  const [homeToast, setHomeToast] = useState<string | null>(null)
  const copyAndToast = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setHomeToast(msg)
    } catch {
      setHomeToast(`${text} — copy not supported on this device`)
    }
    setTimeout(() => setHomeToast(null), 2200)
  }

  // Real-calendar-aware "Today" chip. Only lights up when the visitor's local
  // date actually falls inside the 2026 Durga Puja window (Oct 3 – Oct 8).
  // Outside the puja week the chip hides rather than faking a date — unless
  // the user flips on `tithiDemoMode` in Settings, in which case we pin
  // Ashtami so the flow is still demo-able for reviewers + diaspora users
  // pre-puja. Honesty: the chip shows a small "demo" tag when on the fake
  // path so nothing pretends to be live calendar data.
  const todayTithi = useMemo(() => {
    const iso = new Date().toISOString().slice(0, 10)
    const dateMap: Record<string, string> = {
      '2026-10-03': 'panchami', '2026-10-04': 'shashthi', '2026-10-05': 'saptami',
      '2026-10-06': 'ashtami', '2026-10-07': 'navami', '2026-10-08': 'dashami',
    }
    const planDay = dateMap[iso]
    if (planDay) return { th: tithis.find((x) => x.planDay === planDay) ?? null, demo: false }
    if (tithiDemoMode) return { th: tithis.find((x) => x.planDay === 'ashtami') ?? null, demo: true }
    return { th: null as null | (typeof tithis)[number], demo: false }
  }, [tithiDemoMode])

  // ── Tonight + What-next (Second Product Extension) ──
  // Both compose only facts already on-device: today's tithi, tonight's plan,
  // saved places + intents, GPS check-ins and real distances. Nothing new.
  const [whatNextOpen, setWhatNextOpen] = useState(false)
  const tonightDay = todayTithi.th?.planDay ?? null
  const planStops = useMemo(() => {
    if (!tonightDay) return [] as { place: Place; time: string }[]
    return (planner[tonightDay] ?? [])
      .map((s) => ({ place: placeById(s.placeId), time: s.time }))
      .filter((x): x is { place: Place; time: string } => !!x.place)
  }, [planner, tonightDay])
  const suggestions = useMemo<NextSuggestion[]>(() => {
    if (!flags.ENABLE_WHAT_NEXT) return []
    return suggestNext({
      user: DEMO_USER, now: new Date(),
      todayPlan: tonightDay ? planner[tonightDay] : [], todayDay: tonightDay,
      saved, saveIntents, visited, checkedIn: checkins.map((c) => c.placeId),
      candidates: [...cityPandals, ...cityRestaurants],
    })
  }, [flags.ENABLE_WHAT_NEXT, tonightDay, planner, saved, saveIntents, visited, checkins, cityPandals, cityRestaurants])

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
            <Avatar alt="Profile" className="h-8 w-8 rounded-full" />
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

      {/* Today chip — real-calendar-aware; only renders inside the actual 2026
          puja window (Oct 3 – Oct 8). Never fakes a "today" outside those dates. */}
      {todayTithi.th && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
          onClick={() => nav('/tithi')}
          className="mt-2 flex w-full items-center justify-between gap-2 rounded-card border border-vermilion/25 bg-vermilion-tint px-3 py-2 text-left"
          aria-label={`${t('todayTithi')}: ${todayTithi.th.name}. Open tithi calendar.`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-vermilion text-white">
              <Flame size={14} />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-vermilion">
                {t('todayTithi')}
                {todayTithi.demo && (
                  <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[9px] normal-case tracking-normal text-ink-soft">demo</span>
                )}
              </span>
              <span className="block truncate text-sm font-semibold">{todayTithi.th.name} · <span className="bn">{todayTithi.th.nameBn}</span></span>
              <span className="block truncate text-[11px] text-ink-soft">{todayTithi.th.window}</span>
            </span>
          </span>
          <ChevronDown size={16} className="shrink-0 -rotate-90 text-vermilion" />
        </motion.button>
      )}

      {/* Official alerts banner — urgent notices from an active authority.
          Renders nothing when no live feed is connected (honest, no fake alerts). */}
      {flags.ENABLE_AUTHORITY_INTEGRATION && alerts.length > 0 && (
        <Reveal>
          <button onClick={() => nav('/safety')} className="mt-2 w-full text-left">
            <Card className="flex items-center gap-2.5 border border-gold/40 bg-gold/10 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-white"><Megaphone size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gold-dark">Official alert</p>
                <p className="truncate text-sm text-ink">{alerts[0].text}</p>
              </div>
              <ChevronDown size={16} className="shrink-0 -rotate-90 text-gold-dark" />
            </Card>
          </button>
        </Reveal>
      )}

      {/* Explore Spotlight — animated coverflow carousel (city-scoped,
          hidden when the selected city has no seeded pandals) */}
      {cityPandals.length > 0 && (
        <Reveal>
          <section className="mt-7">
            <SectionHeader title={t('exploreSpotlight')} action={t('viewAll')} onAction={() => nav('/explore')} />
            <SpotlightCarousel pool={cityPandals} />
          </section>
        </Reveal>
      )}

      {/* Nearby Restaurants — city-scoped; hidden when the selected city has
          no seeded restaurants (e.g. multi-city demo cities) so the rail
          never renders as an empty header + blank strip. */}
      {cityRestaurants.length > 0 && (
        <Reveal>
          <section className="mt-2">
            <SectionHeader title={t('nearbyRestaurants')} action={t('viewAll')} onAction={() => nav('/search?type=restaurant')} />
            <Rail>
              {cityRestaurants.slice(0, 4).map((r) => <RailCard key={r.id} place={r} />)}
            </Rail>
          </section>
        </Reveal>
      )}

      {/* Continue where you left off (doc §6) — promoted from further down the
          feed into the slot the sponsored Tanting card used to hold: resuming
          an in-progress session beats trending discovery, and it is the only
          card here that is about *this* user. Renders nothing when no session
          exists, so the feed simply closes up. Markup unchanged. */}
      {session && (
        <Reveal>
          <section className="mt-7">
            <SectionHeader title={t('continueLeft')} />
            <Card className="overflow-hidden p-0">
              <div className="flex items-start gap-3 p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-vermilion-tint text-vermilion">
                  {session.href.includes('/transport/metro') ? <TrainFront size={20} />
                    : session.kind === 'search' ? <SearchIcon size={20} />
                    : session.kind === 'place' ? <MapPin size={20} />
                    : <Compass size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-faint">You were exploring</p>
                  <p className="truncate text-base font-semibold">{session.label}</p>
                  {(session.sublabel || session.detail) && (
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-ink-soft">
                      {session.sublabel && <span className="font-medium">{session.sublabel}</span>}
                      {session.sublabel && session.detail && <span className="text-faint">·</span>}
                      {session.detail && <span>{session.detail}</span>}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-faint">{timeAgo(session.at)}</span>
              </div>
              <button
                onClick={() => nav(session.href)}
                className="grad-brand glow-vermilion flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-white transition-transform hover:brightness-105 active:scale-[0.99]"
              >
                {t('continueBtn')} <ChevronRight size={15} />
              </button>
            </Card>
          </section>
       </Reveal>
      )}

      {/* Tonight Dashboard — contextual evening card (inside the puja window,
          or under tithiDemoMode). Composes plan + weather + one next-step. */}
      {flags.ENABLE_TONIGHT && tonightDay && todayTithi.th && (
        <Reveal>
          <section className="mt-6">
            <TonightDashboard
              day={tonightDay}
              tithi={todayTithi.th}
              isDemo={todayTithi.demo}
              planStops={planStops}
              topSuggestion={suggestions[0] ?? null}
              showWhatNext={flags.ENABLE_WHAT_NEXT}
              onOpenNext={() => setWhatNextOpen(true)}
            />
          </section>
        </Reveal>
      )}

      {/* What-next stays reachable outside the puja window via a slim trigger. */}
      {flags.ENABLE_WHAT_NEXT && !(flags.ENABLE_TONIGHT && tonightDay) && (
        <Reveal>
          <button
            onClick={() => setWhatNextOpen(true)}
            className="mt-6 flex w-full items-center justify-between rounded-card glass p-3.5 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium"><Sparkles size={16} className="text-vermilion" /> {t('whatNextTitle')}</span>
            <ChevronRight size={16} className="text-faint" />
          </button>
        </Reveal>
      )}

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
                onClick={() => copyAndToast(o.code ?? o.brand, o.code ? `Coupon ${o.code} copied` : `${o.brand} copied`)}
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

      {/* Events / local experiences — the off-season bridge (doc §36).
          City-scoped, same empty-rail guard as restaurants above. */}
      {cityEvents.length > 0 && (
        <Reveal>
          <section className="mt-7">
            <SectionHeader title={t('events')} action={t('viewAll')} onAction={() => nav('/beyond-puja')} />
            <Rail>
              {cityEvents.map((e) => (
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
      )}

      {/* Shopping — best-selling Durga Puja sale picks from Kolkata malls.
          Currently demo (`shopping` in data/demo.ts); production replaces it
          with an aggregated feed from mall partners (online + in-store). */}
      <Reveal>
        <section className="mt-7">
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
                    <span className="text-sm font-semibold text-ink tabular-nums">
                      ₹{s.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-faint line-through tabular-nums">
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

      {/* Marketplace rail — appears when the marketplace feature is enabled,
          alongside the mall-ads Shopping rail. Links into the /marketplace page.
          Products are the service's demo catalog (clearly labeled), never a
          fabricated live store. */}
      {flags.ENABLE_MARKETPLACE && marketProducts.length > 0 && (
        <Reveal>
          <section className="mt-7">
            <SectionHeader title="Marketplace" action={t('viewAll')} onAction={() => nav('/marketplace')} />
            <Rail>
              {marketProducts.slice(0, 6).map((p) => (
                <button key={p.id} onClick={() => nav('/marketplace')} className="w-40 shrink-0 text-left">
                  <Card className="overflow-hidden p-0">
                    {/* Same tile the /marketplace grid builds: the product's own photo over
                        its category gradient. Was a hardcoded gradient div, which made all
                        six cards on this rail identical. */}
                    <Img palette={productPalette(p)} src={productImage(p)} alt={p.name} className="h-24" />
                    <div className="p-2">
                      <p className="line-clamp-2 text-[12px] font-semibold leading-snug">{p.name}</p>
                      <p className="mt-1 text-[11px] font-semibold text-vermilion tabular-nums">{p.price > 0 ? `₹${p.price.toLocaleString('en-IN')}` : 'Free offer'}</p>
                      {p.is_demo && <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">Demo</span>}
                    </div>
                  </Card>
                </button>
              ))}
            </Rail>
          </section>
        </Reveal>
      )}

      {/* Social matching teaser — activity-based companions, not dating. */}
      {flags.ENABLE_SOCIAL_MATCHING && (
        <Reveal>
          <section className="mt-7">
            <button onClick={() => nav('/social')} className="w-full text-left active:scale-[0.99]">
              <Card className="flex items-center gap-3 border border-maya/20 p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-maya/15 text-maya"><Users size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Find your puja vibe</p>
                  <p className="text-[11px] text-ink-soft">Meet people planning similar pandal hops, food crawls and walks.</p>
                </div>
                <ChevronDown size={16} className="shrink-0 -rotate-90 text-maya" />
              </Card>
            </button>
          </section>
        </Reveal>
      )}

      {/* Puja tools — quick entries for the Tithi calendar and the Bengali
          Phrasebook. Diaspora users (Delhi / Siliguri / Howrah) lean on these
          the most. Sits above Curated walks because a user checking "what day
          is it?" is in the planning stage, not the on-the-road stage. */}
      <Reveal>
        <section className="mt-7">
          <SectionHeader title={t('pujaTools')} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => nav('/tithi')} className="text-left active:scale-[0.98]">
              <Card className="flex h-full flex-col gap-2 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-vermilion-tint text-vermilion">
                  <Calendar size={17} />
                </span>
                <span className="text-sm font-semibold">{t('tithi')}</span>
                <span className="line-clamp-2 text-[11px] text-faint">{t('tithiSub')}</span>
              </Card>
            </button>
            <button onClick={() => nav('/phrasebook')} className="text-left active:scale-[0.98]">
              <Card className="flex h-full flex-col gap-2 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold">
                  <BookOpen size={17} />
                </span>
                <span className="text-sm font-semibold">{t('phrasebook')}</span>
                <span className="line-clamp-2 text-[11px] text-faint">{t('phrasebookSub')}</span>
              </Card>
            </button>
          </div>
        </section>
      </Reveal>

      {/* Curated walks — themed pandal trails (photography, food, family).
          Tapping a card opens /walks where the full stop-by-stop itinerary is
          shown with an "Add to Planner" CTA that pre-loads that walk. */}
      <Reveal>
        <section className="mt-7">
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

      {/* "Continue where you left off" moved up to the slot the sponsored
          Tanting card held, just under Nearby Restaurants.
          Trending pandals rail was removed — the Explore Spotlight coverflow
          at the top of Home already surfaces trending pandals, this second
          rail added scroll weight without adding information. */}

      {/* Copy-coupon confirmation — portal'd to body: the Page wrapper is
          transformed, which would capture position:fixed. */}
      {homeToast && createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="glass-strong rounded-full px-4 py-2 text-xs font-medium">{homeToast}</div>
        </div>,
        document.body,
      )}

      <WhatNextSheet open={whatNextOpen} onClose={() => setWhatNextOpen(false)} suggestions={suggestions} />
    </Page>
  )
}

/** Relative-time label for the resume card ("just now", "5 min ago", …). */
function timeAgo(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000))
  if (s < 45) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

/**
 * Explore Spotlight — a 3D coverflow carousel. One card sits front-and-centre
 * with two cards peeking from each side, partly tucked behind the main card.
 * Auto-advances on an interval with a spring transition; tap a side card to
 * bring it forward, tap the centre card to open it. Freezes under reduced motion.
 */
function SpotlightCarousel({ pool }: { pool: Place[] }) {
  const nav = useNavigate()
  const reduce = useApp((s) => s.reduceMotion)
  const rm = useReducedMotion()
  const featured = pool.slice(0, 6)
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
