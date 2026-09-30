import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, Users } from 'lucide-react'
import { Button, Card, Chip, Img, Page } from '../components/ui'
import { meetups, placeById } from '../data/demo'
import { useApp } from '../store'
import { haversineKm } from '../lib/geo'
import { useT } from '../i18n'
import { DEMO_USER } from '../data/demo'

export default function Meets() {
  const t = useT()
  const nav = useNavigate()
  const [filter, setFilter] = useState<'all' | 'nearby' | 'interests'>('all')
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
            <Card key={m.id} className="p-3">
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
                <Button size="sm" variant={isJoined ? 'dark' : 'primary'} onClick={() => toggleMeetup(m.id)} disabled={!isJoined && full}>
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
    </Page>
  )
}
