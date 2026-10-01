import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion, motion } from 'framer-motion'
import { AlertTriangle, Cross, Flame, PhoneCall, Search, ShieldQuestion, Users, Siren, Megaphone } from 'lucide-react'
import { Card, Page } from '../components/ui'
import { safetyPoints } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import { useAuthorityAlerts, isStale } from '../services/authority'
import { relativeTime } from '../services/liveNotes'
import type { AuthorityAlert } from '../data/types'

const ALERT_COLOR: Record<AuthorityAlert['alert_type'], string> = {
  emergency: 'text-red-300', traffic: 'text-blue-300', closure: 'text-amber-300',
  safety: 'text-gold-bright', medical: 'text-emerald-300', operational: 'text-violet-300',
}

/** Live official alerts from active authority providers. Renders nothing when
    no backend/feed is connected — we never fabricate an emergency. */
function OfficialAlerts() {
  const { data: alerts = [] } = useAuthorityAlerts()
  if (alerts.length === 0) return null
  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gold-bright">
        <Megaphone size={14} /> Official alerts
      </h2>
      <Card className="divide-y divide-white/10 !bg-white/5 !text-on-image">
        {alerts.map((a) => {
          const stale = isStale(a.expires_at)
          return (
            <div key={a.id} className={`flex items-start gap-3 p-3.5 ${stale ? 'opacity-50' : ''}`}>
              <ShieldQuestion size={16} className={`mt-0.5 shrink-0 ${ALERT_COLOR[a.alert_type]}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-on-image">{a.text}</p>
                <p className="mt-0.5 text-[11px] text-on-image/60">
                  {relativeTime(a.created_at)}
                  {stale && ' · Expired'}
                </p>
              </div>
            </div>
          )
        })}
      </Card>
    </section>
  )
}

const KIND_ICON = { police: PhoneCall, medical: Cross, helpdesk: ShieldQuestion, lostfound: Search, fire: Flame }
const KIND_COLOR = { police: 'bg-blue-600', medical: 'bg-emerald-600', helpdesk: 'bg-violet-600', lostfound: 'bg-amber-500', fire: 'bg-pink-600' }

const SOS_HOLD_MS = 3000

/**
 * Long-press-to-trigger SOS. Honours `prefers-reduced-motion` by dropping the
 * timed hold and instead opening a confirm tap (accessibility requirement —
 * a 3-second press is not physically achievable for everyone).
 */
function SosButton({ onTrigger, reduced }: { onTrigger: () => void; reduced: boolean }) {
  const [progress, setProgress] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)

  const cancel = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setProgress(0)
  }
  const begin = () => {
    if (reduced) { setConfirming(true); return }
    startRef.current = performance.now()
    const tick = () => {
      const p = Math.min(1, (performance.now() - startRef.current) / SOS_HOLD_MS)
      setProgress(p)
      if (p >= 1) { cancel(); onTrigger(); return }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => cancel, [])

  // Keyboard parity with the pointer hold: Space/Enter behave the same as
  // `pointerdown` (start the 3 s hold) and releasing the key is `pointerup`
  // (cancel if under the threshold). Reduced-motion path already opens the
  // confirm dialog on the initial keydown, so keyboard users only ever see
  // the confirm step — same as tap users.
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.repeat) return
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); begin() }
  }
  const onKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cancel() }
  }

  return (
    <div className="relative">
      <button
        onPointerDown={begin}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        aria-label="Emergency SOS — press and hold for 3 seconds"
        aria-describedby="sos-hold-help"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        role={progress > 0 ? 'progressbar' : 'button'}
        className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-red-600 to-rose-500 py-4 text-lg font-bold text-white shadow-lift transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {progress > 0 && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        )}
        <Siren size={20} className="relative z-10" />
        <span className="relative z-10">{reduced ? 'SOS — Tap to send' : 'SOS — Hold 3s to send'}</span>
      </button>
      <p id="sos-hold-help" className="sr-only">
        Hold to send. Releasing early cancels. Uses Web Share API to send your address and a map link to your trusted contact, then falls back to dialing 112.
      </p>
      {confirming && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm emergency SOS"
          className="mt-2 rounded-card border border-white/20 bg-white/10 p-3 text-sm"
        >
          <p className="text-on-image">Send your location to trusted contact + open dialer?</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => { setConfirming(false); onTrigger() }} className="flex-1 rounded-full bg-white py-2 font-semibold text-red-700">Yes, send</button>
            <button onClick={() => setConfirming(false)} className="flex-1 rounded-full border border-white/40 py-2 text-on-image">Cancel</button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/** Safety prioritises clarity & speed over effects (doc §44). */
export default function Safety() {
  const t = useT()
  const nav = useNavigate()
  const reduceMotion = useApp((s) => s.reduceMotion)
  const systemReduce = useReducedMotion()
  const reduced = reduceMotion || systemReduce === true
  const flags = useApp((s) => s.featureFlags)
  const trustedContacts = useApp((s) => s.trustedContacts)
  const currentAddress = useApp((s) => s.currentAddress)
  const setSosActive = useApp((s) => s.setSosActive)

  const triggerSos = () => {
    // 1. Set the "active" flag so Home shows the "I'm safe" dismiss banner
    //    until the user clears it (survives reload via Zustand persist).
    setSosActive(true)
    // 2. Compose a share message with the last known address + a maps deep link.
    const contact = trustedContacts[0]
    const mapsLink = 'https://maps.google.com/?q=' + encodeURIComponent(currentAddress || 'Kolkata')
    const body =
      `SOS from Pujo Sahayak. I need help at ${currentAddress || 'my current location'}.` +
      (contact ? ` (Trusted contact: ${contact.name} — ${contact.phone})` : '') +
      ` Map: ${mapsLink}`
    // 3. Try Web Share (native share sheet on Android) — fall back to tel:112.
    if (navigator.share) {
      navigator.share({ title: 'SOS — Pujo Sahayak', text: body }).catch(() => {
        // user cancelled — dial 112 instead
        window.location.href = 'tel:112'
      })
    } else {
      window.location.href = 'tel:112'
    }
  }

  return (
    <Page className="!bg-gradient-to-b !from-vermilion-dark !via-[#2a1650] !to-night text-on-image [&_.rounded-card]:!border-white/10">
      <header className="flex items-center gap-3">
        <span className="rounded-full bg-white/10 p-2.5"><AlertTriangle size={20} className="text-gold-bright" /></span>
        <div>
          <h1 className="text-xl font-semibold text-on-image">{t('needHelp')}</h1>
          <p className="text-xs text-on-image/70">{t('safetyPriority')}</p>
        </div>
      </header>

      {/* SOS — the primary emergency action. Long press 3s (or tap + confirm
          when reduced motion is on). Sets the store's `sosActive` flag so Home
          keeps a dismissable "I'm safe" banner until the user clears it. */}
      <div className="mt-5">
        <SosButton onTrigger={triggerSos} reduced={reduced} />
        <p className="mt-1.5 text-center text-[10px] text-on-image/50">
          Shares your last known address + a map link with your trusted contact via the system share sheet.
          {trustedContacts.length === 0 && ' Add one in Settings → Trusted contact.'}
        </p>
      </div>

      {/* Direct dial fallback — always visible so users know 112 is one tap away */}
      <a
        href="tel:112"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 py-3 text-base font-bold text-on-image transition-transform active:scale-[0.98]"
      >
        <PhoneCall size={18} /> {t('call112')}
      </a>

      {/* Live official alerts from active authority providers (flag-gated) */}
      {flags.ENABLE_AUTHORITY_INTEGRATION && <OfficialAlerts />}

      {/* Nearby help points */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-gold-bright">{t('nearbyHelp')}</h2>
        <Card className="divide-y divide-white/10 !bg-white/5 !text-on-image">
          {safetyPoints.map((s) => {
            const Icon = KIND_ICON[s.kind]
            return (
              <div key={s.id} className="flex items-center gap-3 p-3.5">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-white ${KIND_COLOR[s.kind]}`}>
                  <Icon size={15} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-image">{s.name}</p>
                  <p className="text-[11px] text-on-image/60">{s.detail}</p>
                </div>
                <span className="text-xs text-gold-bright">{s.distanceM} m</span>
              </div>
            )
          })}
        </Card>
        <p className="mt-1 text-[10px] text-on-image/40">Distances shown are demo values relative to Ballygunge, not your live position.</p>
      </section>

      {/* Sensitive actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => navigator.geolocation?.getCurrentPosition(
            (pos) => window.open(`https://www.google.com/maps/search/?api=1&query=${pos.coords.latitude},${pos.coords.longitude}`, '_blank'),
            () => alert('Could not get your location. Share your surroundings with a nearby help desk.'),
          )}
          className="rounded-full border border-white/25 bg-white/10 py-3 text-sm font-semibold text-on-image"
        >
          {t('iAmLost')}
        </button>
        <button onClick={() => nav('/safety/missing-person')} className="flex items-center justify-center gap-1.5 rounded-full bg-on-image py-3 text-sm font-bold text-vermilion-dark">
          <Users size={15} /> {t('reportMissing')}
        </button>
      </div>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-on-image/40">
        SOS state is stored on this device. Missing-person reports save locally and, when a live
        authority backend is connected, are also routed to the nearest help desk — never to a public
        feed. Authority integration (help desks, control rooms) is partner-dependent and is not
        simulated when no provider is active.
      </p>
    </Page>
  )
}
