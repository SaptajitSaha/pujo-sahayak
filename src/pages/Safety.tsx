import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion, motion } from 'framer-motion'
import { AlertTriangle, Cross, Flame, PhoneCall, Search, ShieldQuestion, Users, Siren, Megaphone, Share2 } from 'lucide-react'
import { Card, Page } from '../components/ui'
import { safetyPoints } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import { getCurrentLocation } from '../lib/geo'
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
  const missingReports = useApp((s) => s.missingReports)
  const removeMissingReport = useApp((s) => s.removeMissingReport)
  const [lostNote, setLostNote] = useState<string | null>(null)
  const [circleNote, setCircleNote] = useState<string | null>(null)
  const [sosNote, setSosNote] = useState<string | null>(null)

  const triggerSos = () => {
    // 1. Arm the banner first, so there is always a way to say "I'm safe" —
    //    including when the share sheet is cancelled a second later.
    setSosActive(true)
    // 2. Compose the share text. The address here is the one saved in the app,
    //    not a GPS fix, so the message says so — the old wording called it
    //    "my current location", which is exactly the wrong thing to tell someone
    //    coming to help. Use "Share my location now" below for a live fix.
    const mapsLink = 'https://maps.google.com/?q=' + encodeURIComponent(currentAddress || 'Kolkata')
    const circle = trustedContacts.map((c) => `${c.name} (${c.phone})`).join(', ')
    const body =
      `SOS from Pujo Sahayak. I need help at my SAVED address: ${currentAddress || 'Kolkata'} — ` +
      `this may not be where I actually am. Circle: ${circle || 'none saved'}. Map: ${mapsLink}`
    // 3. Open the share sheet, or fall back to the dialer. Neither outcome is
    //    ever reported as a delivered message: the Web Share API gives the page
    //    no receipt, so the note states what the app actually did.
    if (navigator.share) {
      navigator.share({ title: 'SOS — Pujo Sahayak', text: body })
        .then(() => setSosNote('Share sheet opened with the message — nothing is sent until you pick an app there. The app cannot confirm delivery.'))
        .catch(() => {
          // Cancelled in the sheet: the dialer is the fallback, not a success.
          window.location.href = 'tel:112'
          setSosNote('Share cancelled — your circle was NOT messaged. Opening the 112 dialer instead.')
        })
    } else {
      window.location.href = 'tel:112'
      setSosNote('This device has no share sheet, so nothing was sent to your circle. Opening the 112 dialer.')
    }
  }

  // One-tap, explicit location share to the circle — NOT live tracking. Grabs a
  // single current fix, opens the OS share sheet pre-filled with a maps link and
  // the circle's names. Nothing is sent until the user picks an app there.
  const shareLocationNow = () => {
    if (!navigator.share) { setCircleNote('This device has no share sheet — call your circle instead.'); return }
    getCurrentLocation().then((loc) => {
      const mapsLink = `https://maps.google.com/?q=${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`
      const circle = trustedContacts.map((c) => c.name).join(', ')
      navigator.share({
        title: 'My location — Pujo Sahayak',
        text: `Sharing my current location with${circle ? ` ${circle}` : ' you'}. ${mapsLink}`,
      }).then(() => setCircleNote(t('sharedWithCircle'))).catch(() => setCircleNote('Share cancelled.'))
    }).catch(() => setCircleNote('Could not get your location. Open the map link and share manually.'))
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
          Shares your saved address + a map link through the system share sheet — the app cannot confirm
          anything reaches a person, so it never claims that it did.
          {trustedContacts.length === 0 && ' Add one in Settings → Trusted contact.'}
        </p>
        {sosNote && (
          <p role="status" className="mt-2 rounded-card border border-gold-bright/40 bg-gold-bright/10 px-3 py-2 text-center text-xs text-on-image">
            {sosNote}
          </p>
        )}
      </div>

      {/* Direct dial fallback — always visible so users know 112 is one tap away */}
      <a
        href="tel:112"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 py-3 text-base font-bold text-on-image transition-transform active:scale-[0.98]"
      >
        <PhoneCall size={18} /> {t('call112')}
      </a>

      {/* Safety Circle (flag-gated) — everyone SOS reaches, plus a one-tap,
          explicit location share. No live tracking: nothing leaves unless the
          user opens the share sheet and picks an app. */}
      {flags.ENABLE_SAFETY_CIRCLE && (
        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gold-bright">
            <Users size={14} /> {t('safetyCircle')}
          </h2>
          <Card className="!bg-white/5 !text-on-image p-3.5">
            {trustedContacts.length ? (
              <ul className="space-y-1.5">
                {trustedContacts.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[11px] font-semibold">{c.name.slice(0, 1)}</span>
                    <span className="flex-1 truncate text-on-image">{c.name}</span>
                    <a href={`tel:${c.phone}`} className="text-xs text-gold-bright">{c.phone}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-on-image/60">{t('circleEmpty')} Add people in Settings → Safety Circle.</p>
            )}
            <button
              onClick={shareLocationNow}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/10 py-2.5 text-sm font-semibold text-on-image active:scale-[0.98]"
            >
              <Share2 size={15} /> {t('shareLocationNow')}
            </button>
            {circleNote && (
              <p role="status" className="mt-2 text-center text-[11px] text-on-image/70">{circleNote}</p>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-on-image/40">{t('safetyCircleSub')}</p>
          </Card>
        </section>
      )}

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
            () => setLostNote('Could not get your location. Share your surroundings with a nearby help desk, or call 112.'),
          )}
          className="rounded-full border border-white/25 bg-white/10 py-3 text-sm font-semibold text-on-image"
        >
          {t('iAmLost')}
        </button>
        <button onClick={() => nav('/safety/missing-person')} className="flex items-center justify-center gap-1.5 rounded-full bg-on-image py-3 text-sm font-bold text-vermilion-dark">
          <Users size={15} /> {t('reportMissing')}
        </button>
      </div>
      {/* Inline, non-blocking error state (never window.alert — it is jarring,
          untranslatable, and steals focus on a safety screen). */}
      {lostNote && (
        <p role="alert" className="mt-2 rounded-card border border-gold-bright/40 bg-gold-bright/10 px-3 py-2 text-center text-xs text-on-image">
          {lostNote}
        </p>
      )}

      {/* Reports filed here are sensitive local data — they must be reviewable
          and erasable, not written-and-forgotten in localStorage. */}
      {missingReports.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-gold-bright">Saved on this device</h2>
          <Card className="divide-y divide-white/10 !bg-white/5 !text-on-image">
            {missingReports.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-on-image">{r.name}</p>
                  <p className="text-[11px] capitalize text-on-image/60">
                    {r.personType} · {new Date(r.createdAt).toLocaleString()}
                    {r.photoAttached ? ' · photo previewed only, not stored' : ''}
                  </p>
                </div>
                <button
                  onClick={() => removeMissingReport(r.id)}
                  aria-label={`Delete the saved report for ${r.name}`}
                  className="shrink-0 rounded-full border border-white/25 px-3 py-1 text-xs text-on-image/80"
                >
                  Delete
                </button>
              </div>
            ))}
          </Card>
          <p className="mt-1 text-[10px] text-on-image/40">
            Deleting removes the record from this device only. Anything already typed into a share sheet
            or sent by message is outside the app's control.
          </p>
        </section>
      )}

      <p className="mt-6 text-center text-[10px] leading-relaxed text-on-image/40">
        SOS state and missing-person reports are stored on this device. Filing a report never forwards
        it to a help desk: no authority integration is connected in this build, and nothing is simulated
        in its place. Reports are kept out of any public feed.
      </p>
    </Page>
  )
}
