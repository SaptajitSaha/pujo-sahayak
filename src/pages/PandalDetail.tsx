import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  BadgeCheck, Bookmark, BookmarkCheck, CalendarCheck, Check, ChevronRight, Camera,
  MapPin, Route as RouteIcon, Share2, ShieldCheck, Sparkles, TrainFront, Truck, Users,
} from 'lucide-react'
import { Button, Card, EASE, Img, Lightbox, MayaMark, Page, Rail, Reveal, SectionHeader, Stars, CrowdTag, Chip, type LightboxItem } from '../components/ui'
import { RailCard } from '../components/PlaceCard'
import { PandalPulse } from '../components/PandalPulse'
import { BestTime } from '../components/BestTime'
import { PandalHistory } from '../components/PandalHistory'
import { StoryMode } from '../components/StoryMode'
import { AccessibilityInfo } from '../components/AccessibilityInfo'
import { PhotoGuide } from '../components/PhotoGuide'
import { OfficialNotices } from '../components/OfficialNotices'
import { LiveNotes } from '../components/LiveNotes'
import { SaveIntentSheet } from '../components/SaveIntentSheet'
import { ReportInfoSheet } from '../components/ReportInfoSheet'
import { ReviewSheet } from '../components/pandal/ReviewSheet'
import { PandalLogistics } from '../components/pandal/PandalLogistics'
import { useOfficialNotices } from '../services/authority'
import { useLiveNotes } from '../services/liveNotes'
import { demoProductsNear } from '../services/marketplace.mock'
import { meetups, pandals, placeById, restaurants } from '../data/demo'
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
  const saveIntents = useApp((s) => s.saveIntents)
  const checkins = useApp((s) => s.checkins)
  const addCheckin = useApp((s) => s.addCheckin)
  const track = useApp((s) => s.track)
  const flags = useApp((s) => s.featureFlags)
  // Live signals shared (same query keys) with the Official Notices / Live Notes
  // sections below; they promote Pandal Pulse rows to sourced provenance.
  const { data: pulseNotices } = useOfficialNotices(place?.id ?? '')
  const { data: pulseNotes } = useLiveNotes(place?.id ?? '')
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
  const [toast, setToast] = useState<string | null>(null)
  // Shared lightbox — top-click photos and past-edition themes open here.
  const [zoom, setZoom] = useState<LightboxItem | null>(null)
  // Optional "why saving" sheet — plain Save stays one tap; this only enriches.
  const [intentOpen, setIntentOpen] = useState(false)
  // "Report incorrect info" micro-flow (5b) — queues a local place_info report.
  const [reportOpen, setReportOpen] = useState(false)

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

  const submitReview = (rating: number, text: string) => {
    if (!place || rating < 1) return
    addReview({
      placeId: place.id,
      rating,
      // Empty text is legitimate (rating-only review) — the card render
      // already guards with r.text.trim(), so persist the trimmed value as-is
      // instead of a stray space placeholder.
      text: text.trim(),
    })
    setReviewOpen(false)
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

  // Logistics sections live in PandalLogistics (proximity-sorted parking,
  // metro timetable, blood banks) — one responsibility per module.

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
          <Img palette={place.palette} alt={place.name} className="h-full w-full" priority sizes="100vw" />
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
          {flags.ENABLE_SAVE_INTENT && (
            <Button variant="outline" size="sm" onClick={() => setIntentOpen(true)} aria-label="Add a saving reason">
              {saveIntents[place.id] ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </Button>
          )}
          <Button variant={isVisited ? 'dark' : 'outline'} size="sm" className="flex-1" onClick={() => toggleVisited(place.id)}>
            <CalendarCheck size={14} /> {isVisited ? 'Visited ✓' : t('visited')}
          </Button>
          <Button size="sm" className="flex-1" onClick={() => nav('/trip/saptami')}>
            <RouteIcon size={14} /> {t('route')}
          </Button>
        </div>

        {/* Report incorrect info — discreet, honest local queue (see 5b). */}
        {flags.ENABLE_INFO_REPORTS && (
          <button
            onClick={() => setReportOpen(true)}
            className="mt-2 text-[11px] text-faint underline-offset-2 hover:text-vermilion hover:underline"
          >
            {t('reportInfoTitle')}
          </button>
        )}

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
        <PandalPulse place={place} notices={pulseNotices} notes={pulseNotes} />

        {/* Best time to visit — modelled calm vs peak windows. */}
        {flags.ENABLE_BEST_TIME && <BestTime place={place} />}

        {/* Trust hierarchy: Official Notices (top) → Visitor Notes (bottom).
            Festival notices belong on the pandal they apply to, so the
            ENABLE_FESTIVAL_NOTICES flag surfaces them here per-place. */}
        {(flags.ENABLE_AUTHORITY_INTEGRATION || flags.ENABLE_FESTIVAL_NOTICES) && (
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

        {/* Story Mode — chaptered expander over the pandal's own record. */}
        {flags.ENABLE_STORY_MODE && <StoryMode place={place} />}

        {/* Accessibility — illustrative on-site facts + a report micro-flow. */}
        {flags.ENABLE_ACCESSIBILITY && <AccessibilityInfo place={place} />}

        {/* Ask Maya */}
        <button onClick={askMaya} className="mt-4 w-full">
          <Card className="flex items-center gap-3 border border-maya/20 !bg-card p-3">
            <MayaMark size={36} className="shrink-0" />
            <span className="flex-1 text-left text-sm font-medium text-maya">{t('askMayaAbout')}…</span>
            <ChevronRight size={16} className="text-maya" />
          </Card>
        </button>

        {/* Past editions — vertical timeline (re-presents existing data) when the
            history flag is on; otherwise the original flat rail. */}
        {place.pastEditions?.length || place.story ? (
          flags.ENABLE_PANDAL_HISTORY ? (
            <PandalHistory place={place} onOpen={setZoom} />
          ) : (
            <section className="mt-5">
              <SectionHeader title={t('pastEditions')} />
              <Rail>
                {place.pastEditions?.map((e) => (
                  <button key={e.year} onClick={() => setZoom({ title: `${e.year} — ${e.theme}`, sub: `Past edition of ${place.name}`, palette: e.palette })} className="w-32 shrink-0 text-left">
                    <Card className="overflow-hidden transition-transform hover:scale-[1.02]">
                      <Img palette={e.palette} alt={`${e.year} theme`} className="h-20" sizes="128px" />
                      <div className="p-2">
                        <p className="text-xs font-semibold">{e.year}</p>
                        <p className="text-[11px] text-ink-soft">{e.theme}</p>
                      </div>
                    </Card>
                  </button>
                ))}
              </Rail>
            </section>
          )
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

        {reviewOpen && (
          <ReviewSheet placeName={place.name} onSubmit={submitReview} onCancel={() => setReviewOpen(false)} />
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

        {flags.ENABLE_SAVE_INTENT && (
          <SaveIntentSheet placeId={place.id} placeName={place.name} open={intentOpen} onClose={() => setIntentOpen(false)} />
        )}

        {flags.ENABLE_INFO_REPORTS && (
          <ReportInfoSheet placeId={place.id} placeName={place.name} open={reportOpen} onClose={() => setReportOpen(false)} />
        )}

        {/* Photo guide — honest tips derived from hours, theme & crowd level. */}
        {flags.ENABLE_PHOTO_GUIDE && <PhotoGuide place={place} />}

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

        {/* Parking / metro timetable / blood banks — proximity-sorted seeded
            reference data, honestly labelled (extracted to PandalLogistics). */}
        <PandalLogistics place={place} />

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
                    <Img palette={m.palette} alt={m.title} className="h-11 w-11 rounded-lg" sizes="44px" />
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
