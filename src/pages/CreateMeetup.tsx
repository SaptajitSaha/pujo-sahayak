import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Chip, Page } from '../components/ui'
import { interests } from '../data/demo'
import { useT } from '../i18n'

export default function CreateMeetup() {
  const t = useT()
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [max, setMax] = useState(10)
  const [restricted, setRestricted] = useState(false)

  const valid = title.trim() && date && time && location.trim()

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
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Meet near Gariahat metro exit 2"
            className="w-full rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
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

      <Button className="mt-4 w-full" disabled={!valid} onClick={() => nav('/meets')}>
        {t('createMeetup')}
      </Button>
      <p className="mt-2 text-center text-[10px] text-faint">
        Meetups you create are stored locally in this demo — host info, reporting and moderation come with the backend.
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
