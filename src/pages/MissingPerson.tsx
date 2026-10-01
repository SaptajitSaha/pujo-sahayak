import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, CheckCircle2 } from 'lucide-react'
import { Button, Card, Chip, Img, Page } from '../components/ui'
import { pandals } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/auth'
import { useAuthorityProviders } from '../services/authority'

const STEPS = ['Person', 'Details', 'Location', 'Submit'] as const

export default function MissingPerson() {
  const t = useT()
  const nav = useNavigate()
  const reportMissing = useApp((s) => s.reportMissing)
  const { data: providers = [] } = useAuthorityProviders()
  const anyActive = providers.some((p) => p.is_active)
  const [step, setStep] = useState(0)
  const [personType, setPersonType] = useState<'child' | 'adult' | 'elderly'>('adult')
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [done, setDone] = useState<null | 'local' | 'sent'>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const addReport = reportMissing
  const canNext = step === 0 ? Boolean(personType) : step === 1 ? name.trim().length > 1 : true

  const submit = async () => {
    const report = {
      id: `mp-${Date.now()}`, personType, name, details, lastSeenPlaceId: placeId || undefined,
      photoDataUrl: photo, createdAt: new Date().toISOString(),
    }
    // 1. Always save locally (survives via Zustand persist).
    addReport(report)
    // 2. Persist to the server only when Supabase is configured AND a real
    //    authority provider is active — never fabricate a live transmission.
    if (supabase && anyActive) {
      try {
        const userId = await getUserId()
        await supabase.from('user_reports').insert({
          reporter_id: userId,
          target_type: 'missing_person',
          target_id: report.id,
          reason: `${report.personType}: ${report.name} — ${report.details || 'no further details'} (last seen: ${pandals.find((p) => p.id === placeId)?.name ?? 'unknown'})`,
        })
        setDone('sent')
        return
      } catch {
        // Server write failed — the local copy still stands; be honest about it.
      }
    }
    setDone('local')
  }

  if (done) {
    return (
      <Page>
        <Card className="mt-10 p-6 text-center">
          <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
          <h1 className="mt-3 text-lg font-semibold">{done === 'sent' ? 'Report sent to the help desk' : 'Report saved on this device'}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {done === 'sent'
              ? 'Your report was routed to the nearest authorised help desk. It was never posted to a public feed.'
              : 'In the production system this report would route to the nearest authorised help desk and operator — never to a public feed. That integration is partner-dependent, so nothing has been sent anywhere yet.'}
          </p>
          <p className="mt-2 text-xs text-faint">If this is urgent right now, call 112.</p>
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
              className="w-full rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
              placeholder="Clothing, height, anything distinctive…"
              className="w-full resize-none rounded-lg border border-ink/10 bg-ivory px-3 py-2.5 text-sm outline-none focus:border-vermilion/50" />
            <button onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-ink/15 py-5 text-faint">
              {photo ? <Img palette={{ from: '#333', to: '#666' }} alt="Photo" src={photo} className="h-20 w-20 rounded-lg" /> : <Camera size={20} />}
              <span className="text-xs">Upload Photo — clear, recent photo</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)) }} />
          </Card>
        )}
        {step === 2 && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Where were they last seen?</h2>
            <div className="mt-3 space-y-2">
              {pandals.slice(0, 5).map((p) => (
                <button key={p.id} onClick={() => setPlaceId(p.id)}
                  className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm ${
                    placeId === p.id ? 'border-vermilion bg-vermilion-tint' : 'border-ink/10 bg-card'}`}>
                  <Img palette={p.palette} alt={p.name} className="h-8 w-8 rounded-md" />
                  {p.name} <span className="ml-auto text-xs text-faint">{p.area}</span>
                </button>
              ))}
            </div>
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
              <Row k="Photo" v={photo ? 'attached' : 'none'} />
            </dl>
            <p className="mt-3 rounded-lg bg-ivory-deep p-2.5 text-[11px] leading-relaxed text-ink-soft">
              This stays on your device. Sensitive missing-person information is never turned into a
              public social feed (doc §45). For anything urgent, call 112 now.
            </p>
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
