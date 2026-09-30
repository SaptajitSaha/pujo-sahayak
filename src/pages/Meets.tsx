import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Plus, Share2, Users, X } from 'lucide-react'
import { Button, Card, Chip, Img, Page } from '../components/ui'
import { meetups, placeById } from '../data/demo'
import { useApp } from '../store'
import { haversineKm } from '../lib/geo'
import { useT } from '../i18n'
import { DEMO_USER } from '../data/demo'
import type { Meetup } from '../data/types'

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
  const saved = useApp((s) => s.saved)

  const list = useMemo(() => {
    if (filter === 'nearby') {
      return [...meetups].sort(
        (a, b) =>
          haversineKm(DEMO_USER.lat, DEMO_USER.lng, a.lat, a.lng) -
          haversineKm(DEMO_USER.lat, DEMO_USER.lng, b.lat, b.lng),
      )
    }
    if (filter === 'interests') {
      const myInterests: Set<string> = new Set(
        saved.map((id) => placeById(id)?.type).map((ty) => (ty === 'restaurant' ? 'Food' : 'Pandal hopping')),
      )
      return meetups.filter((m) => m.interests.some((i) => myInterests.has(i)))
    }
    return meetups
  }, [filter, saved])

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

      <div className="mt-4 space-y-3">
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
                <Img palette={m.palette} alt={m.title} className="h-16 w-16 shrink-0 rounded-lg" />
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
                  {m.attendees} going
                </span>
                <Button size="sm" variant={isJoined ? 'dark' : 'primary'} onClick={(e) => { e.stopPropagation(); toggleMeetup(m.id) }} disabled={!isJoined && full}>
                  {isJoined ? t('joined') : full ? 'Full' : t('join')}
                </Button>
              </div>
            </Card>
          )
        })}
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
