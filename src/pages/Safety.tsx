import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Cross, Flame, PhoneCall, Search, ShieldQuestion, Users } from 'lucide-react'
import { Card, Page } from '../components/ui'
import { safetyPoints } from '../data/demo'
import { useT } from '../i18n'

const KIND_ICON = { police: PhoneCall, medical: Cross, helpdesk: ShieldQuestion, lostfound: Search, fire: Flame }
const KIND_COLOR = { police: 'bg-blue-600', medical: 'bg-emerald-600', helpdesk: 'bg-violet-600', lostfound: 'bg-amber-500', fire: 'bg-pink-600' }

/** Safety prioritises clarity & speed over effects (doc §44). */
export default function Safety() {
  const t = useT()
  const nav = useNavigate()

  return (
    <Page className="!bg-gradient-to-b !from-vermilion-dark !via-[#2a1650] !to-night text-on-image [&_.rounded-card]:!border-white/10">
      <header className="flex items-center gap-3">
        <span className="rounded-full bg-white/10 p-2.5"><AlertTriangle size={20} className="text-gold-bright" /></span>
        <div>
          <h1 className="text-xl font-semibold text-on-image">{t('needHelp')}</h1>
          <p className="text-xs text-on-image/70">{t('safetyPriority')}</p>
        </div>
      </header>

      {/* Primary emergency action */}
      <a
        href="tel:112"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full grad-brand py-4 text-lg font-bold text-white shadow-lift transition-transform active:scale-[0.98]"
      >
        <PhoneCall size={20} /> {t('call112')}
      </a>
      <p className="mt-1 text-center text-[10px] text-on-image/50">112 — the universal emergency number for police, fire and ambulance.</p>

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
        Missing-person reports are stored only on this device in the demo build. Authority integration
        (help desks, control rooms) is partner-dependent and deliberately not simulated.
      </p>
    </Page>
  )
}
