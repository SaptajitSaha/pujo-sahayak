import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  BadgeCheck, Bookmark, BookmarkCheck, CalendarCheck, Check, ChevronRight, Camera,
  MapPin, Route as RouteIcon, Share2, ShieldCheck, Sparkles, TrainFront, Truck, Users,
} from 'lucide-react'
import { Button, Card, EASE, Img, Lightbox, MayaMark, Page, Rail, Reveal, SectionHeader, Stars, CrowdTag, Chip, type LightboxItem } from '../components/ui'
import { RailCard } from '../components/PlaceCard'
import { PandalPulse } from '../components/PandalPulse'
import { OfficialNotices } from '../components/OfficialNotices'
import { LiveNotes } from '../components/LiveNotes'
import { demoProductsNear } from '../services/marketplace.mock'
import { meetups, pandals, placeById, restaurants, parkingSpots, bloodBanks, metroETAs } from '../data/demo'
import { useApp } from '../store'
import { getCurrentLocationPrecise, haversineKm } from '../lib/geo'
import { tithiForTs, withinGeofence } from '../lib/scorecard'
import { makeShareCard, shareCardFile } from '../lib/shareCard'
import { useT } from '../i18n'

export default function PandalDetail() {
  const { id = '' } = useParams()
  const t = useT()
  const nav = useNavigate()
  const place = placeById(id)
  const saved = useApp((s) => s.saved)
  const visited = useApp((s) => s.visited)
  const toggleSaved = useApp((s) => s.toggleSaved)
  const toggleVisited = useApp((s) => s.toggleVisited)
  const checkins = useApp((s) => s.checkins)
  const addCheckin = useApp((s) => s.addCheckin)
  const track = useApp((s) => s.track)
  const flags = useApp((s) => s.featureFlags)
  const [photoState, setPhotoState] = useState<'idle' | 'checking' | 'ok'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  // On-site check-in: the sole way a visit enters the Scorecard. Gated by real
  // GPS — no location, no check-in. Honest failure states, never a fake success.
  const [checkIn, setCheckIn] = useState<'idle' | 'locating' | 'ok' | 'far' | 'denied'>('idle')
  const [checkInMsg, setCheckInMsg] = useState('')
  const todayTithi = tithiForTs(Date.now())
  const checkedInToday = !!place && checkins.some((c) => c.placeId === place.id && c.tithi === todayTithi)
  const onCheckIn = async () => {
    if (!place) return
    setCheckIn('locating')
    setCheckInMsg('')
    try {
      const loc = await getCurrentLocationPrecise()
      if (withinGeofence(loc, { lat: place.lat, lng: place.lng }, loc.accuracyM)) {
        addCheckin({ placeId: place.id, tithi: todayTithi, ts: Date.now(), lat: loc.lat, lng: loc.lng, accuracyM: loc.accuracyM })
        setCheckIn('ok')
      } else {
        setCheckIn('far')
        setCheckInMsg('You’re not at this pandal yet — move closer and try again.')
      }
    } catch (e) {
      const msg = (e as Error).message
      setCheckIn(msg.toLowerCase().includes('denied') ? 'denied' : 'far')
      setCheckInMsg(msg)
    }
  }
  const reviews = useApp((s) => s.reviews)
  const addReview = useApp((s) => s.addReview)
  const [cardBusy, setCardBusy] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  // Focus the review sheet when it opens: the Escape handler lives on the
  // overlay, so without this the key event never reaches it when the user
  // opened the modal by clicking the "Rate this" chip (focus stays outside).
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (reviewOpen) dialogRef.current?.focus()
  }, [reviewOpen])
  const [draftRating, setDraftRating] = useState(0)
  const [draftText, setDraftText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  // Shared lightbox — top-click photos and past-edition themes open here.
  const [zoom, setZoom] = useState<LightboxItem | null>(null)

  // Opens an external walking/driving route for a named spot (parking ground,
  // metro station). Plain Maps search URL — no key, no fake integration.
  const openDirections = (name: string, area: string) =>
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${area} Kolkata`)}`, '_blank', 'noopener,noreferrer')

  const onShareCard = async () => {
    if (!place) return
    setCardBusy(true)
    try {
      const url = `${window.location.origin}/pandal/${place.id}`
      const blob = await makeShareCard(place, { url })
      const shared = await shareCardFile(blob, `pujo-${place.id}.png`, place.name)
      setToast(shared ? 'Card shared' : 'Card saved to Downloads')
    } catch {
      setToast('Card generation failed on this device')
    } finally {
      setCardBusy(false)
      setTimeout(() => setToast(null), 2500)
    }
  }

  const userReviews = place ? reviews.filter((r) => r.placeId === place.id) : []

  const submitReview = () => {
    if (!place || draftRating < 1) return
    addReview({
      placeId: place.id,
      rating: draftRating,
      // Empty text is legitimate (rating-only review) — the card render
      // already guards with r.text.trim(), so persist the trimmed value as-is
      // instead of a stray space placeholder.
      text: draftText.trim(),
    })
    setReviewOpen(false)
    setDraftRating(0)
    setDraftText('')
    setToast('Thanks — review saved on this device')
    setTimeout(() => setToast(null), 2500)
  }

  const similar = useMemo(() => {
    if (!place) return []
    return pandals.filter((x) => x.id !== place.id && (x.area === place.area || x.theme === place.theme)).slice(0, 4)
  }, [place])
  const nearby = useMemo(() => {
    if (!place) return []
    return [...restaurants].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4)
  }, [place])
  const nearMeetups = useMemo(() => {
    if (!place) return []
    return meetups.filter((m) => haversineKm(m.lat, m.lng, place.lat, place.lng) < 4).slice(0, 2)
  }, [place])

  // Nearby marketplace picks for this pandal's area (demo catalog, clearly
  // labeled in the card). Only surfaced when the marketplace flag is on.
  const nearProducts = useMemo(() => (place ? demoProductsNear(place.area) : []), [place])

  // Logistics — parking, metro timetable, blood banks. Sorted by proximity
  // to this pandal (haversine km) with the pandal's own id boosted to the
  // front when present in the entity's nearestPandalIds hint list. All three
  // arrays are seeded reference data — a "sample timetable / verify on-site"
  // caption keeps the honesty convention the rest of the app follows.
  const nearParking = useMemo(() => {
    if (!place) return []
    return [...parkingSpots]
      .map((p) => ({
        p,
        km: haversineKm(place.lat, place.lng, p.lat, p.lng),
        hinted: p.nearestPandalIds.includes(place.id),
      }))
      .sort((a, b) => (b.hinted ? 1 : 0) - (a.hinted ? 1 : 0) || a.km - b.km)
      .slice(0, 3)
  }, [place])
  const nearMetro = useMemo(() => {
    if (!place) return []
    return [...metroETAs]
      .map((m) => ({
        m,
        km: haversineKm(place.lat, place.lng, 0, 0), // no coords on MetroETA — hinted only
        hinted: m.nearestPandalIds.includes(place.id),
      }))
      .sort((a, b) => (b.hinted ? 1 : 0) - (a.hinted ? 1 : 0))
      .slice(0, 2)
  }, [place])
  const nearBlood = useMemo(() => {
    if (!place) return []
    return [...bloodBanks]
      .map((b) => ({ b, km: haversineKm(place.lat, place.lng, b.lat, b.lng) }))
      .sort((x, y) => x.km - y.km)
      .slice(0, 3)
  }, [place])

  // Hero parallax — the backdrop image drifts and zooms subtly as you scroll.
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 70])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2])

  if (!place || place.type !== 'pandal') {
    return (
      <Page>
        <div className="flex flex-col items-center gap-3 pt-20 text-center">
          <p className="text-sm text-faint">This pandal page doesn't exist — the link may be old or mistyped.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => nav('/explore')}>Browse pandals</Button>
            <Button size="sm" variant="outline" onClick={() => nav('/search')}>Search</Button>
          </div>
        </div>
      </Page>
    )
  }
  const isSaved = saved.includes(place.id)
  const isVisited = visited.includes(place.id)

  const askMaya = () => {
    track({ kind: 'place', label: place.name, href: `/pandal/${place.id}`, at: Date.now() })
    nav('/maya', { state: { placeId: place.id } })
  }

  const onUpload = () => {
    setPhotoState('checking')
    // Local simulation of the AI photo-verification pipeline (doc §25) —
    // honest demo flow, no real inference claimed.
    setTimeout(() => setPhotoState('ok'), 1600)
  }

  return (
    <Page className="!px-0 !pt-0">
      {/* Hero */}
      <div ref={heroRef} className="grain relative h-64 overflow-hidden">
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute -inset-8">
          <Img palette={place.palette} alt={place.name} className="h-full w-full" />
        </motion.div>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button aria-label="Go back" onClick={() => nav(-1)} className="rounded-full bg-night/50 p-2 text-on-image">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <div className="flex gap-2">
            <button aria-label="Share" onClick={onShareCard} disabled={cardBusy} className="rounded-full bg-night/50 p-2 text-on-image disabled:opacity-60">
              <Share2 size={16} className={cardBusy ? 'animate-pulse' : ''} />
            </button>
            <button
              aria-label={isSaved ? 'Remove from saved' : 'Save'}
              onClick={() => toggleSaved(place.id)}
              className="rounded-full bg-night/50 p-2 text-on-image"
            >
              {isSaved ? <BookmarkCheck size={16} className="text-gold-bright" /> : <Bookmark size={16} />}
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/80 to-transparent p-4 pt-24">
          <div className="flex items-end justify-between gap-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.55, ease: EASE }}
              className="text-on-image [text-shadow:0_1px_10px_rgba(0,0,0,0.75)]"
            >
              <h1 className="font-display text-2xl">{place.name}</h1>
              <p className="flex items-center gap-1 text-xs text-on-image/90">
                <MapPin size={12} /> {place.subtitle} • {place.area}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: EASE }}
        className="px-4"
      >
        {/* Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Stars rating={place.rating} count={place.reviewCount} />
          <span className="text-faint">• {place.distanceKm} km •</span>
          {place.crowd && <CrowdTag level={place.crowd} />}
        </div>
        {place.openTill && (
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t('openTill')} {place.openTill}
          </p>
        )}

        {/* Action row */}
        <div className="mt-3 flex gap-2">
          <Button variant={isSaved ? 'dark' : 'outline'} size="sm" className="flex-1" onClick={() => toggleSaved(place.id)}>
            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} {isSaved ? t('saved') : t('save')}
          </Button>
          <Button variant={isVisited ? 'dark' : 'outline'} size="sm" className="flex-1" onClick={() => toggleVisited(place.id)}>
            <CalendarCheck size={14} /> {isVisited ? 'Visited ✓' : t('visited')}
          </Button>
          <Button size="sm" className="flex-1" onClick={() => nav('/trip/saptami')}>
            <RouteIcon size={14} /> {t('route')}
          </Button>
        </div>

        {/* On-site check-in — verified by GPS, feeds the Scorecard in Profile. */}
        <div className="mt-2">
          <Button
            variant={checkedInToday || checkIn === 'ok' ? 'dark' : 'outline'}
            size="sm" className="w-full"
            disabled={checkIn === 'locating' || checkedInToday}
            onClick={onCheckIn}
          >
            <BadgeCheck size={14} />
            {checkedInToday || checkIn === 'ok'
              ? 'Checked in — nice!'
              : checkIn === 'locating'
                ? 'Locating…'
                : 'Check in here (verify on-site)'}
          </Button>
          {checkInMsg && (
            <p role="status" aria-live="polite" className="mt-1 text-[11px] text-faint">{checkInMsg}</p>
          )}
        </div>

        {/* Pandal Pulse — six at-a-glance status tiles, derived/modelled on-device. */}
        <PandalPulse place={place} />

        {/* Trust hierarchy: Official Notices (top) → Visitor Notes (bottom) */}
        {flags.ENABLE_AUTHORITY_INTEGRATION && (
          <OfficialNotices placeId={place.id} />
        )}
        {flags.ENABLE_LIVE_NOTES && (
          <LiveNotes placeId={place.id} />
        )}

        {/* Trust hierarchy continued: nearby marketplace + social plan teaser */}
        {flags.ENABLE_MARKETPLACE && nearProducts.length > 0 && (
          <section className="mt-5">
            <SectionHeader title="Nearby in the Marketplace" action={t('viewAll')} onAction={() => nav('/marketplace')} />
            <Rail>
              {nearProducts.map((p) => (
                <button key={p.id} onClick={() => nav('/marketplace')} className="w-40 shrink-0 text-left">
                  <Card className="overflow-hidden p-0">
                    <div className="h-20 w-full" style={{ backgroundImage: 'linear-gradient(135deg, #4a1230, #963a5c)' }} />
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
        )}
        {flags.ENABLE_SOCIAL_MATCHING && (
          <button onClick={() => nav('/social')} className="mt-4 w-full text-left">
            <Card className="flex items-center gap-3 border border-maya/20 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-maya/15 text-maya"><Users size={16} /></span>
              <span className="flex-1 text-sm font-medium text-maya">People planning to visit {place.name}…</span>
              <ChevronRight size={16} className="text-maya" />
            </Card>
          </button>
        )}

        {/* Info tiles */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { icon: MapPin, label: 'Location', to: `/trip/saptami` },
            { icon: TrainFront, label: 'Metro', to: `/transport/metro` },
            { icon: Truck, label: 'Facilities', to: `/search?q=facilities` },
            { icon: ShieldCheck, label: 'Safety', to: '/safety' },
          ].map(({ icon: Icon, label, to }) => (
            <button key={label} onClick={() => nav(to)} className="flex flex-col items-center gap-1.5 rounded-card bg-card p-2.5 shadow-card transition-transform hover:scale-105 active:scale-95">
              <span className="rounded-full bg-vermilion-tint p-2 text-vermilion"><Icon size={16} /></span>
              <span className="text-[11px] text-ink-soft">{label}</span>
            </button>
          ))}
        </div>

        {/* About */}
        <Reveal>
          <section className="mt-5">
            <SectionHeader title={t('aboutThis')} />
            <p className="text-sm leading-relaxed text-ink-soft">{place.story}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-faint">
              <span className="rounded-full bg-ivory-deep px-2.5 py-1">Theme: <b className="text-ink">{place.theme}</b></span>
              {place.artist && (
                <button
                  onClick={() => nav(`/artist/${encodeURIComponent(place.artist!)}`)}
                  className="rounded-full bg-ivory-deep px-2.5 py-1 transition-colors hover:bg-vermilion/10"
                >
                  Artist: <b className="text-ink">{place.artist}</b> ›
                </button>
              )}
              {place.metro && <span className="rounded-full bg-ivory-deep px-2.5 py-1">🚇 {place.metro}</span>}
            </div>
          </section>
        </Reveal>

        {/* Ask Maya */}
        <button onClick={askMaya} className="mt-4 w-full">
          <Card className="flex items-center gap-3 border border-maya/20 !bg-card p-3">
            <MayaMark size={36} className="shrink-0" />
            <span className="flex-1 text-left text-sm font-medium text-maya">{t('askMayaAbout')}…</span>
            <ChevronRight size={16} className="text-maya" />
          </Card>
        </button>

        {/* Past editions */}
        {place.pastEditions?.length ? (
          <section className="mt-5">
            <SectionHeader title={t('pastEditions')} />
            <Rail>
              {place.pastEditions.map((e) => (
                <button key={e.year} onClick={() => setZoom({ title: `${e.year} — ${e.theme}`, sub: `Past edition of ${place.name}`, palette: e.palette })} className="w-32 shrink-0 text-left">
                  <Card className="overflow-hidden transition-transform hover:scale-[1.02]">
                    <Img palette={e.palette} alt={`${e.year} theme`} className="h-20" />
                    <div className="p-2">
                      <p className="text-xs font-semibold">{e.year}</p>
                      <p className="text-[11px] text-ink-soft">{e.theme}</p>
                    </div>
                  </Card>
                </button>
              ))}
            </Rail>
          </section>
        ) : null}

        {/* What others say — user reviews (persisted) on top, demo seed under */}
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <SectionHeader title={t('whatOthersSay')} />
            <Chip onClick={() => setReviewOpen(true)}>{t('rateThis')}</Chip>
          </div>
          <div className="space-y-2">
            {userReviews.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">You</p>
                  <Stars rating={r.rating} />
                </div>
                {r.text.trim() && <p className="mt-1 text-sm text-ink-soft">“{r.text}”</p>}
                <p className="mt-1 text-[10px] text-faint">{new Date(r.createdAt).toLocaleDateString()}</p>
              </Card>
            ))}
            {place.reviews?.length ? place.reviews.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.author}</p>
                  <Stars rating={r.rating} />
                </div>
                <p className="mt-1 text-sm text-ink-soft">“{r.text}”</p>
                <p className="mt-1 text-[10px] text-faint">{r.date}</p>
              </Card>
            )) : userReviews.length === 0 && <p className="text-sm text-faint">No reviews yet.</p>}
          </div>
        </section>

        {reviewOpen && createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-night/60"
            onClick={() => setReviewOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setReviewOpen(false) }}
            role="presentation"
          >
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-lg rounded-t-2xl bg-card p-4 outline-none"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-modal-title"
            >
              <h3 id="review-modal-title" className="text-base font-semibold">{t('rateThis')} — {place.name}</h3>
              <div className="mt-3 flex justify-center gap-1" role="radiogroup" aria-label="Star rating, 1 to 5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={draftRating === n}
                    aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    onClick={() => setDraftRating(n)}
                    className="p-1 text-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-vermilion rounded"
                  >
                    <span className={n <= draftRating ? 'text-gold-bright' : 'text-ink/20'}>★</span>
                  </button>
                ))}
              </div>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Optional: what stood out?"
                rows={3}
                aria-label="Optional review text"
                className="mt-3 w-full rounded-card border border-ink/10 bg-ivory-deep p-3 text-sm outline-none focus:border-vermilion"
              />
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setReviewOpen(false)}>Cancel</Button>
                <Button className="flex-1" disabled={draftRating === 0} onClick={submitReview}>Save review</Button>
              </div>
              <p className="mt-2 text-[10px] text-faint">Reviews stay on this device in the demo build — no account, no upload.</p>
            </motion.div>
          </div>,
          document.body,
        )}

        {toast && (
          <div
            className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
            role="status"
            aria-live="polite"
          >
            <div className="glass-strong rounded-full px-4 py-2 text-xs font-medium">{toast}</div>
          </div>
        )}

        <Lightbox item={zoom} onClose={() => setZoom(null)} />

        {/* Top clicks + upload */}
        <section className="mt-5">
          <SectionHeader title={t('topClicks')} />
          <div className="grid grid-cols-3 gap-2">
            {(place.topClicks ?? []).map((ph) => (
              <button key={ph.id} onClick={() => setZoom({ title: ph.title, sub: `📷 ${ph.author} • ♥ ${ph.likes}`, palette: ph.palette })} className="text-left">
                <Card className="overflow-hidden transition-transform hover:scale-[1.02]">
                  <Img palette={ph.palette} alt={ph.title} className="h-20" />
                  <div className="p-1.5">
                    <p className="truncate text-[10px] font-medium">{ph.title}</p>
                    <p className="text-[10px] text-faint">♥ {ph.likes}</p>
                  </div>
                </Card>
              </button>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-vermilion/40 bg-vermilion-tint/40 p-2 text-vermilion"
            >
              <Camera size={18} />
              <span className="text-[10px] font-medium">{t('postPhotos')} +</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          {photoState !== 'idle' && (
            <Card className="mt-2 flex items-center gap-2 p-3 text-sm">
              {photoState === 'checking' ? (
                <><Sparkles size={16} className="animate-pulse text-maya" /> Verifying this photo actually shows {place.name}…</>
              ) : (
                <><Check size={16} className="text-emerald-600" /> Looks like {place.name} — thanks! Posted as a visitor photo. <span className="text-[10px] text-faint">(demo verification)</span></>
              )}
            </Card>
          )}
        </section>

        {/* Parking — closest grounds with walk-time + rate chip. Sample data
            (capacity varies on puja evening — verify on-site). */}
        {nearParking.length > 0 && (
          <section className="mt-5">
            <SectionHeader title={t('parking')} />
            <div className="space-y-2">
              {nearParking.map(({ p, km, hinted }) => (
                <Card key={p.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-faint">{p.area} · {km.toFixed(1)} km · {p.walkTimeMin} min walk</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-ivory-deep px-2 py-1 text-[10px] text-ink capitalize">
                    {p.capacityHint}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-ink tabular-nums">₹{p.ratePerHour}/h</span>
                  {hinted && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Serves this pandal</span>}
                  <button onClick={() => openDirections(p.name, p.area)} aria-label={`Directions to ${p.name}`} className="shrink-0 rounded-full border border-vermilion/40 p-1.5 text-vermilion">
                    <MapPin size={13} />
                  </button>
                </Card>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-faint">Capacity varies on puja evening — verify on-site.</p>
          </section>
        )}

        {/* Metro timetable — nearest stations with first/last train + headway.
            Static reference data, honestly labelled. */}
        {nearMetro.length > 0 && (
          <section className="mt-5">
            <SectionHeader title={t('metroTimetable')} />
            <div className="space-y-2">
              {nearMetro.map(({ m, hinted }) => (
                <Card key={m.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{m.station}</p>
                    <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink">{m.line}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-faint">
                    <span>First {m.firstTrain}</span>
                    <span>Last {m.lastTrain}</span>
                    <span>Every {m.frequencyMin} min</span>
                    {hinted && <span className="font-medium text-emerald-700">Nearest to this pandal</span>}
                    <button onClick={() => openDirections(m.station, 'Metro')} aria-label={`Directions to ${m.station} station`} className="ml-auto flex items-center gap-1 rounded-full border border-vermilion/40 px-2 py-0.5 text-[10px] font-medium text-vermilion">
                      <MapPin size={11} /> Directions
                    </button>
                  </div>
                </Card>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-faint">Timetable sample — check on-site for Puja-week special services.</p>
          </section>
        )}

        {/* Blood banks — closest 3 with available groups + phone. Emergency
            resources; kept compact so they're findable at a glance. */}
        {nearBlood.length > 0 && (
          <section className="mt-5">
            <SectionHeader title={t('bloodBanks')} />
            <div className="space-y-2">
              {nearBlood.map(({ b, km }) => (
                <Card key={b.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{b.name}</p>
                      <p className="text-[11px] text-faint">{b.hospital} · {b.area} · {km.toFixed(1)} km</p>
                    </div>
                    <a href={`tel:${b.phone.replace(/\s+/g, '')}`} className="shrink-0 rounded-full bg-vermilion px-3 py-1 text-[11px] font-semibold text-white">
                      Call
                    </a>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {b.availableGroups.map((g) => (
                      <span key={g} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">{g}</span>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-faint">{b.hours}</p>
                </Card>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-faint">Availability is illustrative — always phone before travelling.</p>
          </section>
        )}

        {/* Similar */}
        <section className="mt-5">
          <SectionHeader title={t('similarPlaces')} />
          <Rail>{similar.map((s) => <RailCard key={s.id} place={s} />)}</Rail>
        </section>

        {/* Nearby restaurants */}
        <section className="mt-5">
          <p className="mb-2 text-sm font-medium text-ink-soft">{t('hungry')}</p>
          <SectionHeader title="Nearby Restaurants" action={t('viewAll')} onAction={() => nav('/search?type=restaurant')} />
          <Rail>{nearby.map((r) => <RailCard key={r.id} place={r} />)}</Rail>
        </section>

        {/* Nearby meetups */}
        {nearMeetups.length > 0 && (
          <section className="mt-5">
            <SectionHeader title={t('meetupsNear')} />
            <div className="space-y-2">
              {nearMeetups.map((m) => (
                <button key={m.id} onClick={() => nav('/meets')} className="w-full text-left">
                  <Card className="flex items-center gap-3 p-3">
                    <Img palette={m.palette} alt={m.title} className="h-11 w-11 rounded-lg" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{m.title}</p>
                      <p className="text-xs text-faint">{m.date} • {m.time}</p>
                    </div>
                    <span className="rounded-full border border-vermilion/40 px-3 py-1 text-xs font-medium text-vermilion">
                      {t('join')} / View
                    </span>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </Page>
  )
}
