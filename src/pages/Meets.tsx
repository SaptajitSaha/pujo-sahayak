import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Plus, Share2, Trash2, Users, X } from 'lucide-react'
import { Button, Card, Chip, Img, Page } from '../components/ui'
import { meetups, placeById, safetyPoints } from '../data/demo'
import { useApp } from '../store'
import { haversineKm } from '../lib/geo'
import { isUpcoming } from '../lib/meetupDate'
import { suggestMeetingPoint } from '../lib/meetingPoint'
import { useT } from '../i18n'
import { DEMO_USER } from '../data/demo'
import type { LocalMeetup, Meetup } from '../data/types'

/** ISO 'YYYY-MM-DD' + 'HH:MM' from the create form → a readable label. Falls
    back to the raw values rather than printing "Invalid Date". */
function humanWhen(date: string, time: string): string {
  const at = new Date(`${date}T${time}`)
  if (Number.isNaN(at.getTime())) return `${date} ${time}`
  return `${at.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} • ${at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

/** A meetup the user created. No attendee counts and no coordinates it does not
    have: everything on this card is something the filer actually entered. */
function UserMeetupCard({ m, onDelete }: { m: LocalMeetup; onDelete: () => void }) {
  return (
    <Card className="p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{m.title}</h3>
          <p className="text-xs text-ink-soft">{humanWhen(m.date, m.time)}</p>
          <p className="flex items-center gap-1 text-[11px] text-faint">
            <MapPin size={10} /> {m.location}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-ivory-deep px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-soft">
          Yours
        </span>
      </div>
      {m.description && <p className="mt-1.5 line-clamp-2 text-[11px] text-ink-soft">{m.description}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {m.interests.map((i) => <span key={i} className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink">{i}</span>)}
        <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink">up to {m.maxParticipants}</span>
        {m.visibility === 'restricted' && <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink">restricted</span>}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {/* Directions only when a real spot was chosen — a typed location has no
            coordinates, and plotting a guess would be a fabricated position. */}
        {m.lat !== undefined && m.lng !== undefined && (
          <Button size="sm" variant="outline" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`, '_blank', 'noopener,noreferrer')}>
            <MapPin size={13} /> Directions
          </Button>
        )}
        <button onClick={onDelete} aria-label={`Delete ${m.title}`} className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-faint hover:text-vermilion">
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </Card>
  )
}

export default function Meets() {
  const t = useT()
  const nav = useNavigate()
  const [filter, setFilter] = useState<'all' | 'nearby' | 'interests'>('all')
  // Bottom-sheet detail view — opened by tapping anywhere on a meetup card.
  const [openMeet, setOpenMeet] = useState<Meetup | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (openMeet) sheetRef.current?.focus() }, [openMeet])
  const joined = useApp((s) => s.joinedMeetups)
  const toggleMeetup = useApp((s) => s.toggleMeetup)
  const userMeetups = useApp((s) => s.userMeetups)
  const removeMeetup = useApp((s) => s.removeMeetup)
  const saved = useApp((s) => s.saved)
  const flags = useApp((s) => s.featureFlags)

  // Seeded meetups are a curated sample of the puja week, so their dates are
  // static labels. Once one has passed it must stop being offered as upcoming.
  const upcoming = useMemo(() => meetups.filter((m) => isUpcoming(m.date, m.time)), [])

  const list = useMemo(() => {
    if (filter === 'nearby') {
      return [...upcoming].sort(
        (a, b) =>
          haversineKm(DEMO_USER.lat, DEMO_USER.lng, a.lat, a.lng) -
          haversineKm(DEMO_USER.lat, DEMO_USER.lng, b.lat, b.lng),
      )
    }
    if (filter === 'interests') {
      const myInterests: Set<string> = new Set(
        saved.map((id) => placeById(id)?.type).map((ty) => (ty === 'restaurant' ? 'Food' : 'Pandal hopping')),
      )
      return upcoming.filter((m) => m.interests.some((i) => myInterests.has(i)))
    }
    return upcoming
  }, [filter, saved, upcoming])

  return (
    <Page>
      <h1 className="text-xl font-semibold">{t('meets')}</h1>
      <p className="mt-1 text-xs text-ink-soft">Find or organise meetups around shared plans — activity-based, never a dating app.</p>

      <div className="mt-3 flex gap-2">
        {(['all', 'nearby', 'interests'] as const).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'nearby' ? 'Nearby' : 'My Interests'}
          </Chip>
        ))}
      </div>

      {/* Meetups the user created are shown apart from the curated examples —
          one is real data on this device, the other is a sample layout. */}
      {userMeetups.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold">Yours · stored on this device</h2>
          <div className="space-y-3">
            {userMeetups.map((m) => (
              <UserMeetupCard key={m.id} m={m} onDelete={() => removeMeetup(m.id)} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Sample meetups</h2>
        <span className="text-[10px] text-faint">Illustrative plans, not live bookings</span>
      </div>
      <div className="mt-2 space-y-3">
        {list.map((m) => {
          const isJoined = joined.includes(m.id)
          const full = m.attendees + (isJoined ? 1 : 0) >= m.maxParticipants
          return (
            <Card
              key={m.id}
              className="cursor-pointer p-3"
              role="button"
              tabIndex={0}
              aria-label={`Open details for ${m.title}`}
              onClick={() => setOpenMeet(m)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenMeet(m) } }}
            >
              <div className="flex gap-3">
                <Img palette={m.palette} alt={m.title} className="h-16 w-16 shrink-0 rounded-lg" sizes="64px" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{m.title}</h3>
                  <p className="text-xs text-ink-soft">{m.date} • {m.time}</p>
                  <p className="flex items-center gap-1 text-[11px] text-faint">
                    <MapPin size={10} /> {m.location}
                    {m.visibility === 'restricted' && <span className="ml-1 rounded-full bg-ivory-deep px-1.5 text-[9px]">restricted</span>}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-ink-soft">{m.description}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-faint">
                  <Users size={12} />
                  {[0, 1, 2].slice(0, Math.min(3, m.attendees)).map((i) => (
                    <span key={i} className="h-5 w-5 rounded-full border border-card" style={{ background: `linear-gradient(135deg, ${m.palette.from}, ${m.palette.to})` }} />
                  ))}
                  {/* Attendee counts and these avatar dots are seeded layout
                      values, so they are labelled — a count that reads as live
                      people is the kind of claim this app never makes. */}
                  {m.attendees} going · sample
                </span>
                <Button size="sm" variant={isJoined ? 'dark' : 'primary'} onClick={(e) => { e.stopPropagation(); toggleMeetup(m.id) }} disabled={!isJoined && full}>
                  {isJoined ? t('joined') : full ? 'Full' : t('join')}
                </Button>
              </div>
            </Card>
          )
        })}
        {list.length === 0 && (
          <Card className="p-5 text-center text-sm text-faint">
            {upcoming.length === 0
              ? 'The sample meetups for the 2026 puja week have all passed. Create your own with the button below.'
              : 'No sample meetup matches this filter. Try “All”.'}
          </Card>
        )}
      </div>

      <Button className="mt-5 w-full" onClick={() => nav('/meets/create')}>
        <Plus size={15} /> {t('createMeetup')}
      </Button>
      <p className="mt-2 text-center text-[10px] text-faint">
        Your first meetup is free. Monetisation model not final — this is a concept, not a price promise.
      </p>

      {/* Meetup detail bottom sheet — full description, interests, join,
          directions to the meeting point, and share via Web Share. */}
      {openMeet && (() => {
        const isJoined = joined.includes(openMeet.id)
        const full = openMeet.attendees + (isJoined ? 1 : 0) >= openMeet.maxParticipants
        return createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-night/60"
            onClick={() => setOpenMeet(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setOpenMeet(null) }}
            role="presentation"
          >
            <motion.div
              ref={sheetRef} tabIndex={-1}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-lg rounded-t-2xl bg-card p-4 outline-none"
              onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-labelledby="meet-sheet-title"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 id="meet-sheet-title" className="text-base font-semibold">{openMeet.title}</h3>
                <button aria-label="Close" onClick={() => setOpenMeet(null)} className="rounded-full bg-ivory-deep p-1.5 text-ink-soft"><X size={14} /></button>
              </div>
              <Img palette={openMeet.palette} alt={openMeet.title} className="mt-2 h-28 rounded-card" />
              <p className="mt-2 text-xs text-ink-soft">{openMeet.date} • {openMeet.time}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-faint"><MapPin size={11} /> {openMeet.location}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{openMeet.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {openMeet.interests.map((i) => <span key={i} className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink">{i}</span>)}
                {openMeet.host && <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink">Hosted by {openMeet.host}</span>}
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-faint"><Users size={12} /> {openMeet.attendees} going · max {openMeet.maxParticipants}{openMeet.visibility === 'restricted' ? ' · restricted' : ''}</p>
              {flags.ENABLE_SMART_MEETING && (() => {
                // Honest, on-device suggestion: the real, staffed safety spot nearest
                // the middle of your area and the meetup's stated location. Never
                // auto-chosen, never invented — it only ever names a known place.
                const s = suggestMeetingPoint(
                  [{ lat: DEMO_USER.lat, lng: DEMO_USER.lng }, { lat: openMeet.lat, lng: openMeet.lng }],
                  safetyPoints.map((sp) => ({ id: sp.id, name: sp.name, detail: sp.detail, lat: sp.lat, lng: sp.lng })),
                )
                if (!s) return null
                return (
                  <div className="mt-3 rounded-card border border-ink/10 bg-ivory-deep p-3">
                    <p className="text-xs font-semibold text-ink">{t('meetingPointTitle')}</p>
                    <p className="mt-1 text-sm font-medium text-ink">{s.spot.name}</p>
                    {s.spot.detail && <p className="text-[11px] text-faint">{s.spot.detail}</p>}
                    <p className="mt-1 text-[11px] text-faint">
                      {t('walkApprox')} {s.distancesKm[0].toFixed(1)} km from you
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${s.spot.lat},${s.spot.lng}`, '_blank', 'noopener,noreferrer')}>
                        <MapPin size={13} /> Directions
                      </Button>
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-faint">{t('meetingPointSub')}</p>
                  </div>
                )
              })()}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant={isJoined ? 'dark' : 'primary'} className="flex-1" disabled={!isJoined && full} onClick={() => toggleMeetup(openMeet.id)}>
                  {isJoined ? t('joined') : full ? 'Full' : t('join')}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${openMeet.lat},${openMeet.lng}`, '_blank', 'noopener,noreferrer')}>
                  <MapPin size={13} /> Directions
                </Button>
                <Button size="sm" variant="ghost" aria-label="Share meetup" onClick={() => {
                  const url = `${window.location.origin}/meets`
                  const msg = `Join "${openMeet.title}" on Pujo Sahayak — ${openMeet.date}, ${openMeet.time} at ${openMeet.location}. ${url}`
                  if (navigator.share) navigator.share({ title: openMeet.title, text: msg }).catch(() => {})
                  else navigator.clipboard?.writeText(msg).then(() => navigator.vibrate?.(30))
                }}>
                  <Share2 size={13} /> Share
                </Button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )
      })()}
    </Page>
  )
}
