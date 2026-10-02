import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, CheckCircle2, CloudOff, Inbox } from 'lucide-react'
import { Button, Card, Chip, Img, Page } from '../components/ui'
import { pandals } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/auth'
import { useAuthorityProviders } from '../services/authority'

const STEPS = ['Person', 'Details', 'Location', 'Submit'] as const

/**
 * Where a filed report actually ended up. There is deliberately no 'sent to the
 * help desk' outcome: no authority routing exists in this build, so claiming it
 * would be the most consequential lie the app could tell a frightened user.
 *  - 'local'   saved on this device only (no backend configured / signed out)
 *  - 'queued'  saved here and recorded in the app's report table, still with no
 *              authority on the other end to receive it
 *  - 'failed'  saved here, but the server write errored — said out loud
 */
type Outcome = 'local' | 'queued' | 'failed'

export default function MissingPerson() {
  const t = useT()
  const nav = useNavigate()
  const reportMissing = useApp((s) => s.reportMissing)
  const selectedCity = useApp((s) => s.selectedCity)
  const { data: providers = [] } = useAuthorityProviders()
  const anyActive = providers.some((p) => p.is_active)
  const [step, setStep] = useState(0)
  const [personType, setPersonType] = useState<'child' | 'adult' | 'elderly'>('adult')
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [done, setDone] = useState<null | Outcome>(null)
  const [failReason, setFailReason] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // A blob URL is only valid for this document session. Revoke the previous one
  // on replace and on unmount so filing a photo never leaks an object.
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo) }, [photo])

  const addReport = reportMissing
  const canNext = step === 0 ? Boolean(personType) : step === 1 ? name.trim().length > 1 : true

  // Last-seen choices are the pandals of the city the user actually selected —
  // offering Kolkata pandals to a Siliguri user produced reports about places
  // that cannot be the right answer.
  const cityPandals = pandals.filter((p) => p.cityId === selectedCity)

  const submit = async () => {
    const report = {
      id: `mp-${Date.now()}`, personType, name: name.trim(), details: details.trim(),
      lastSeenPlaceId: placeId || undefined,
      // Flag only — the image itself is previewed and discarded (see types.ts).
      photoAttached: Boolean(photo),
      createdAt: new Date().toISOString(),
    }
    // 1. Always save locally (survives via Zustand persist).
    addReport(report)

    // 2. With no backend there is nothing to write to; say so, don't imply a
    //    transmission that cannot happen.
    if (!supabase) { setDone('local'); return }

    // 3. A backend is configured: attempt the queue write and check the result.
    //    supabase-js returns errors instead of throwing, so `await` alone is
    //    not a success signal — reading `error` is the whole check.
    try {
      const userId = await getUserId()
      const { error } = await supabase.from('user_reports').insert({
        reporter_id: userId,
        target_type: 'missing_person',
        target_id: report.id,
        reason: `${report.personType}: ${report.name} — ${report.details || 'no further details'} (last seen: ${pandals.find((p) => p.id === placeId)?.name ?? 'unknown'})`,
      })
      if (error) {
        setFailReason(error.message)
        setDone('failed')
        return
      }
      setDone('queued')
    } catch (e) {
      setFailReason((e as Error).message)
      setDone('failed')
    }
  }

  if (done) {
    const headline =
      done === 'queued' ? 'Report recorded in the app' :
      done === 'failed' ? 'Report saved here — the upload failed' :
      'Report saved on this device'
    return (
      <Page>
        <Card className="mt-10 p-6 text-center">
          {done === 'failed'
            ? <CloudOff size={40} className="mx-auto text-vermilion" />
            : <CheckCircle2 size={40} className="mx-auto text-emerald-600" />}
          <h1 className="mt-3 text-lg font-semibold">{headline}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {done === 'queued' && (
              <>Your report is stored on this device and recorded in the app's report queue.
                {' '}<b>No police, help desk or operator receives it</b> — authority routing is partner
                dependent and is not connected in this build, so nothing has been forwarded anywhere.</>
            )}
            {done === 'local' && (
              <>Everything you entered is stored on this device only. No backend is connected, so
                nothing was transmitted, and no help desk has been notified.</>
            )}
            {done === 'failed' && (
              <>The copy on this device is safe, but the app's report queue rejected the upload
                ({failReason || 'backend unavailable'}). Nothing reached a help desk.</>
            )}
          </p>
          <p className="mt-3 text-sm font-medium text-vermilion">
            This app cannot alert anyone for you. If someone is missing right now, call 112.
          </p>
          <p className="mt-1 text-xs text-faint">
            {done !== 'local' && 'The photo you picked was previewed only — it was not saved or uploaded. '}
            Manage saved reports from the Safety Center.
          </p>
          <Button className="mt-4" onClick={() => nav('/safety')}>Back to Safety Center</Button>
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <button onClick={() => nav('/safety')} className="text-sm text-ink-soft">‹ {t('reportMissing')}</button>

      {/* Stepper */}
      <ol className="mt-4 flex items-center gap-1.5" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
              i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-vermilion text-on-image' : 'bg-ivory-deep text-faint'}`}>
              {i < step ? '✓' : i + 1}
            </span>
            <span className="text-[10px] text-ink-soft">{s}</span>
          </li>
        ))}
      </ol>

      <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="mt-5">
        {step === 0 && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Who is missing?</h2>
            <div className="mt-3 flex gap-2">
              {(['child', 'adult', 'elderly'] as const).map((p) => (
                <Chip key={p} active={personType === p} onClick={() => setPersonType(p)} className="capitalize">{p}</Chip>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-faint">
              Age restrictions and sensitive handling rules apply once authority integration exists.
            </p>
          </Card>
        )}
        {step === 1 && (
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Basic details</h2>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-soft">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Their name"
                className="w-full rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-soft">Appearance</span>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
                placeholder="Clothing, height, anything distinctive…"
                className="w-full resize-none rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
            </label>
            <button onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-ink/15 py-5 text-faint">
              {photo
                ? <Img palette={{ from: '#333', to: '#666' }} alt="Photo preview" src={photo} className="h-20 w-20 rounded-lg" sizes="80px" />
                : <Camera size={20} />}
              <span className="text-xs">{photo ? 'Change photo (preview only)' : 'Add photo — clear, recent photo'}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                if (photo) URL.revokeObjectURL(photo)
                setPhoto(URL.createObjectURL(f))
              }} />
            <p className="text-[10px] text-faint">
              The photo stays in memory while you file — it is not stored on this device afterwards
              and never uploaded.
            </p>
          </Card>
        )}
        {step === 2 && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Where were they last seen?</h2>
            {cityPandals.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-soft">
                No pandals are listed for this city yet. Leave it unset — or change the city in Settings.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {cityPandals.slice(0, 5).map((p) => (
                  <button key={p.id} onClick={() => setPlaceId(p.id)} aria-pressed={placeId === p.id}
                    className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm ${
                      placeId === p.id ? 'border-vermilion bg-vermilion-tint' : 'border-ink/10 bg-card'}`}>
                    <Img palette={p.palette} alt={p.name} className="h-8 w-8 rounded-md" sizes="32px" />
                    {p.name} <span className="ml-auto text-xs text-faint">{p.area}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}
        {step === 3 && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Review & submit</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row k="Type" v={personType} />
              <Row k="Name" v={name} />
              <Row k="Details" v={details || '—'} />
              <Row k="Last seen" v={pandals.find((p) => p.id === placeId)?.name ?? '—'} />
              <Row k="Photo" v={photo ? 'attached for preview only' : 'none'} />
            </dl>
            <p className="mt-3 rounded-lg bg-ivory-deep p-2.5 text-[11px] leading-relaxed text-ink-soft">
              {/* Matches what submit() actually does — the old line promised the
                  report "stays on your device" while also offering to transmit
                  identifying details. */}
              {supabase
                ? 'Saved on this device, and recorded in this app’s report queue. It is NOT sent to any police station or help desk — that integration is not connected. Sensitive missing-person information is never turned into a public feed (doc §45).'
                : 'Saved on this device only — no backend is connected, so nothing is transmitted. Sensitive missing-person information is never turned into a public feed (doc §45).'}
              {' '}For anything urgent, call 112 now.
            </p>
            {supabase && anyActive && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-soft">
                <Inbox size={13} className="mt-0.5 shrink-0 text-vermilion" />
                An authority provider is marked active, but this build has no routing code that delivers a
                report to it — submitting still only queues the record.
              </p>
            )}
          </Card>
        )}
      </motion.div>

      <div className="mt-4 flex gap-2">
        {step > 0 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>}
        {step < 3 ? (
          <Button className="flex-1" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Next</Button>
        ) : (
          <Button className="flex-1" onClick={submit}>Submit report</Button>
        )}
      </div>
    </Page>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-faint">{k}</dt>
      <dd className="text-right font-medium capitalize">{v}</dd>
    </div>
  )
}
