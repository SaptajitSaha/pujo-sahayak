import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Button, Card, Chip, Page } from '../components/ui'
import { interests, placeById, safetyPoints, DEMO_USER } from '../data/demo'
import { useApp } from '../store'
import { suggestMeetingPoint } from '../lib/meetingPoint'
import { useT } from '../i18n'

/** A surface colour for the created card's tile — a design token, not a claim
 *  about real content (the demo catalogues carry their own palettes). */
const MEETUP_PALETTE = { from: '#5B2A86', to: '#2A1440' }

export default function CreateMeetup() {
  const t = useT()
  const nav = useNavigate()
  const flags = useApp((s) => s.featureFlags)
  const saved = useApp((s) => s.saved)
  const addMeetup = useApp((s) => s.addMeetup)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [max, setMax] = useState(10)
  const [restricted, setRestricted] = useState(false)
  // Coordinates only exist when the spot came from a real seeded safety point.
  // A hand-typed location gets no lat/lng — inventing numbers for it would feed
  // a fake position into the map, the distance and the directions link.
  const [spotCoords, setSpotCoords] = useState<{ lat: number; lng: number } | null>(null)

  const valid = Boolean(title.trim() && date && time && location.trim())

  /**
   * Submit persists the meetup locally and returns to the list, which is what
   * the footnote has always claimed ("stored locally in this demo"). Before,
   * the button only navigated and the form was silently discarded.
   */
  const submit = () => {
    if (!valid) return
    addMeetup({
      title: title.trim(),
      date,
      time,
      location: location.trim(),
      description: description.trim(),
      interests: picked,
      maxParticipants: Math.min(50, Math.max(2, Math.round(max) || 2)),
      visibility: restricted ? 'restricted' : 'public',
      palette: MEETUP_PALETTE,
      lat: spotCoords?.lat,
      lng: spotCoords?.lng,
    })
    nav('/meets')
  }

  // "Suggest a spot": a real, staffed safety point near the middle of the places
  // you've saved (your likely areas). Fills the location box as a starting point —
  // you can still edit it. Never invents a place: only names a known safety point.
  const suggestSpot = () => {
    const origins = [DEMO_USER, ...saved.map((id) => placeById(id)).filter(Boolean).map((p) => ({ lat: p!.lat, lng: p!.lng }))]
    const s = suggestMeetingPoint(origins, safetyPoints.map((sp) => ({ id: sp.id, name: sp.name, detail: sp.detail, lat: sp.lat, lng: sp.lng })))
    if (s) {
      setLocation(`Meet near ${s.spot.name}${s.spot.detail ? `, ${s.spot.detail}` : ''}`)
      setSpotCoords({ lat: s.spot.lat, lng: s.spot.lng })
    }
  }

  return (
    <Page>
      <h1 className="text-lg font-semibold">{t('createMeetup')}</h1>

      <Card className="mt-4 space-y-4 p-4">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. South Kolkata Pandal Hop"
            className="w-full rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
          </Field>
          <Field label="Time">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
          </Field>
        </div>
        <Field label="Location">
          <input value={location} onChange={(e) => { setLocation(e.target.value); setSpotCoords(null) }} placeholder="Meet near Gariahat metro exit 2"
            className="w-full rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
          {flags.ENABLE_SMART_MEETING && (
            <button type="button" onClick={suggestSpot} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-vermilion">
              <MapPin size={12} /> {t('suggestSpot')}
            </button>
          )}
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={300}
            placeholder="Tell people about your meetup…"
            className="w-full resize-none rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
          <p className="mt-0.5 text-right text-[10px] text-faint">{description.length}/300</p>
        </Field>
        <Field label="Interest / Vibe">
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <Chip key={i} active={picked.includes(i)} onClick={() => setPicked((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])}>
                {i}
              </Chip>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 items-end gap-3">
          <Field label="Max participants">
            <input type="number" min={2} max={50} value={max} onChange={(e) => setMax(Number(e.target.value))}
              className="w-full rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
          </Field>
          <Field label="Visibility">
            <div className="flex rounded-full border border-ink/10 bg-ivory p-1">
              {(['public', 'restricted'] as const).map((v) => (
                <button key={v} onClick={() => setRestricted(v === 'restricted')}
                  className={`flex-1 rounded-full py-1.5 text-xs font-medium capitalize ${
                    (v === 'restricted') === restricted ? 'bg-vermilion text-on-image' : 'text-ink-soft'}`}>
                  {v}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      <Button className="mt-4 w-full" disabled={!valid} onClick={submit}>
        {t('createMeetup')}
      </Button>
      <p className="mt-2 text-center text-[10px] text-faint">
        Saved on this device only — the meetup appears under “Yours” on the Meetups
        screen. No one else can see it: hosting, reporting and moderation come with
        the backend, which is not connected.
      </p>
    </Page>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  )
}
