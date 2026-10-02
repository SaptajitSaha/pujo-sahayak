import { useState } from 'react'
import {
  ArrowRight, Globe, Image as ImageIcon, Info, MapPin, Palette, Phone, Shield, FlaskConical,
} from 'lucide-react'
import { BackHeader, Card, Chip, Logo, Page } from '../components/ui'
import { AuthorityPanel } from '../components/AuthorityPanel'
import { CITIES } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { City, Lang, Theme } from '../data/types'
import type { FeatureFlag } from '../config/features'

export default function Settings() {
  const t = useT()
  const [toast, setToast] = useState<string | null>(null)
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)
  const theme = useApp((s) => s.theme)
  const setTheme = useApp((s) => s.setTheme)
  const reduceMotion = useApp((s) => s.reduceMotion)
  const setReduceMotion = useApp((s) => s.setReduceMotion)
  const appLogo = useApp((s) => s.appLogo)
  const setAppLogo = useApp((s) => s.setAppLogo)
  const trustedContacts = useApp((s) => s.trustedContacts)
  const setTrustedContacts = useApp((s) => s.setTrustedContacts)
  const selectedCity = useApp((s) => s.selectedCity)
  const setSelectedCity = useApp((s) => s.setSelectedCity)
  const tithiDemoMode = useApp((s) => s.tithiDemoMode)
  const setTithiDemoMode = useApp((s) => s.setTithiDemoMode)
  const featureFlags = useApp((s) => s.featureFlags)
  const setFeatureFlag = useApp((s) => s.setFeatureFlag)

  const [contactName, setContactName] = useState(trustedContacts[0]?.name ?? '')
  const [contactPhone, setContactPhone] = useState(trustedContacts[0]?.phone ?? '')

  const note = (s: string) => { setToast(s); setTimeout(() => setToast(null), 2200) }

  const saveContact = () => {
    const name = contactName.trim()
    const phone = contactPhone.trim()
    if (!name || !phone) { note('Enter both a name and a phone number.'); return }
    // Only digits, +, spaces, dashes count as valid — reject anything else so we
    // never persist obvious typos like "call me later" into the phone field.
    if (!/^[+\d][\d\s-]{6,}$/.test(phone)) { note('Phone looks wrong — use digits, +, spaces or dashes.'); return }
    if (featureFlags.ENABLE_SAFETY_CIRCLE) {
      // Circle of up to 5 — additive, no live tracking; SOS + one-tap share reach all.
      if (trustedContacts.length >= 5) { note(t('circleFull')); return }
      setTrustedContacts([...trustedContacts, { id: 'tc-' + Date.now(), name, phone }])
      setContactName(''); setContactPhone('')
      note(`${name} added to your circle.`)
    } else {
      setTrustedContacts([{ id: 'tc-' + Date.now(), name, phone }])
      note('Trusted contact saved. Shown in SOS.')
    }
  }
  const removeContact = (id: string) => setTrustedContacts(trustedContacts.filter((c) => c.id !== id))
  const clearContact = () => { setTrustedContacts([]); setContactName(''); setContactPhone(''); note('Trusted contact removed.') }

  const Row = ({ icon: Icon, label, value, onClick }: { icon: typeof Info; label: string; value?: string; onClick?: () => void }) => (
    <button onClick={onClick} className="w-full text-left">
      <Card className="flex items-center gap-3 p-3.5">
        <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><Icon size={15} /></span>
        <span className="flex-1 text-sm font-medium">{label}</span>
        {value && <span className="text-xs text-faint">{value}</span>}
        <ArrowRight size={14} className="text-faint" />
      </Card>
    </button>
  )

  return (
    <Page>
      <BackHeader title={t('settings')} />

      {/* Preferences only. Account/sign-in, Help (Safety Center) and Premium are
          reached from Profile; Notifications has its own page off the Home bell
          — duplicating them here as stubs contradicted working features. */}
      <div className="space-y-2">
        {/* Privacy and Security used to be two buttons that answered with a
            toast — an affordance that promised controls which do not exist.
            Stated plainly instead, as non-interactive content. */}
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><Shield size={15} /></span>
            <span className="flex-1 text-sm font-medium">Privacy &amp; data on this device</span>
          </div>
          <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-faint">
            <li>· Location, check-ins, saves, plan, diary and reviews stay in this browser/device storage.</li>
            <li>· Nothing is uploaded until a backend is configured; with one connected, community posts, social preferences and reports go to it.</li>
            <li>· Missing-person reports are held locally and can be deleted from the Safety Center.</li>
            <li>· No account deletion or export flow exists in this build — clearing site data is the only erase.</li>
          </ul>
        </Card>

        {/* City — swaps the dataset across Explore, Home, Search, Categories,
            Planner, TripMap, PandalDetail, RestaurantDetail. Siliguri / Howrah
            / New Delhi subsets are seeded; the framework grows by data alone. */}
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><MapPin size={15} /></span>
            <span className="flex-1 text-sm font-medium">{t('selectCity')}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <Chip key={c.id} active={selectedCity === c.id} onClick={() => setSelectedCity(c.id as City)}>
                {c.label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-faint">
            Every pandal, restaurant and walk is filtered to {CITIES.find((c) => c.id === selectedCity)?.label}.
          </p>
        </Card>

        {/* Safety Circle (up to 5) or single Trusted Contact — SOS shares your
            location with everyone here via the OS share sheet. Local only, no
            live tracking: nothing leaves the device unless a tap opens the sheet. */}
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><Phone size={15} /></span>
            <span className="flex-1 text-sm font-medium">{featureFlags.ENABLE_SAFETY_CIRCLE ? t('safetyCircle') : t('trustedContact')}</span>
          </div>
          {featureFlags.ENABLE_SAFETY_CIRCLE && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{t('safetyCircleSub')}</p>
          )}
          <div className="mt-2.5 space-y-2">
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Name (e.g. Ma, Priya)"
              className="w-full rounded-full border border-ink/10 bg-ivory-deep px-3 py-2 text-sm outline-none focus:border-vermilion"
            />
            <input
              type="tel"
              inputMode="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Phone (e.g. +91 98300 00000)"
              className="w-full rounded-full border border-ink/10 bg-ivory-deep px-3 py-2 text-sm outline-none focus:border-vermilion"
            />
            <div className="flex gap-2">
              <button onClick={saveContact} className="flex-1 rounded-full grad-brand py-2 text-sm font-semibold text-white">
                {featureFlags.ENABLE_SAFETY_CIRCLE ? t('circleAdd') : (trustedContacts.length ? 'Update' : 'Save')}
              </button>
              {trustedContacts.length > 0 && !featureFlags.ENABLE_SAFETY_CIRCLE && (
                <button onClick={clearContact} className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink-soft">
                  Remove
                </button>
              )}
            </div>
            {featureFlags.ENABLE_SAFETY_CIRCLE && (
              trustedContacts.length ? (
                <ul className="mt-1 space-y-1">
                  {trustedContacts.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 rounded-full bg-ivory-deep px-3 py-1.5 text-xs">
                      <span className="flex-1 truncate font-medium text-ink">{c.name}</span>
                      <span className="text-faint">{c.phone}</span>
                      <button aria-label={`Remove ${c.name}`} onClick={() => removeContact(c.id)} className="text-faint hover:text-vermilion">✕</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] text-faint">{t('circleEmpty')}</p>
              )
            )}
            {!featureFlags.ENABLE_SAFETY_CIRCLE && trustedContacts[0] && (
              <p className="text-[10px] text-faint">Current: {trustedContacts[0].name} · {trustedContacts[0].phone}</p>
            )}
          </div>
        </Card>

        {/* Language */}
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><Globe size={15} /></span>
            <span className="flex-1 text-sm font-medium">Language</span>
          </div>
          <div className="mt-2.5 flex gap-2">
            {(['en', 'bn', 'hi'] as Lang[]).map((l) => (
              <Chip key={l} active={lang === l} onClick={() => setLang(l)} className={l === 'bn' ? 'bn' : ''}>
                {l === 'en' ? 'English' : l === 'bn' ? 'বাংলা' : 'हिंदी'}
              </Chip>
            ))}
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><Palette size={15} /></span>
            <span className="flex-1 text-sm font-medium">{t('appearance')}</span>
          </div>
          <div className="mt-2.5 flex gap-2">
            {(['light', 'dark', 'system'] as Theme[]).map((th) => (
              <Chip key={th} active={theme === th} onClick={() => setTheme(th)} className="capitalize">{th}</Chip>
            ))}
          </div>
          <label className="mt-3 flex items-center justify-between text-sm">
            <span className="text-ink-soft">Reduce motion</span>
            <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} className="h-5 w-5 accent-[#7c3aed]" />
          </label>
          <label className="mt-2 flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block text-ink-soft">Show “Today: &lt;tithi&gt;” year-round</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-faint">
                Off by default — the chip only lights up inside the real 2026 puja window (Oct 3–8). Turn on to preview the flow any day; the chip is tagged “demo” so nothing fakes live dates.
              </span>
            </span>
            <input
              type="checkbox"
              checked={tithiDemoMode}
              onChange={(e) => setTithiDemoMode(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#c8451f]"
              aria-label="Year-round demo mode for the Home tithi chip"
            />
          </label>
        </Card>

        {/* App logo personalisation (doc §34) */}
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><ImageIcon size={15} /></span>
            <span className="flex-1 text-sm font-medium">App Logo</span>
          </div>
          <div className="mt-3 flex gap-4">
            {(['classic', 'no-eye'] as const).map((v) => (
              <button key={v} onClick={() => setAppLogo(v)} className={`rounded-2xl p-1 transition-all ${appLogo === v ? 'ring-2 ring-vermilion' : 'opacity-60'}`}>
                <Logo size={44} className="rounded-xl" />
                <span className="mt-1 block text-[10px] capitalize">{v === 'classic' ? 'Classic' : 'Minimal'}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Developer: feature flag toggles. Collapsed behind an explicit
            disclosure — these are build-time switches for whoever is developing
            or reviewing the app, not settings an ordinary user should be shown. */}
        <details className="mt-4 overflow-hidden rounded-card border border-ink/10 bg-card">
          <summary className="flex cursor-pointer items-center gap-3 p-3.5 text-sm font-medium">
            <span className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><FlaskConical size={15} /></span>
            Developer settings
          </summary>
          <div className="px-3.5 pb-3.5">
            <p className="text-[10px] text-faint">
              Feature flags for this build. Toggling hides a surface's UI and blocks its route
              on this device only — it is not a setting for everyday use.
            </p>
            <div className="mt-2.5 space-y-2">
              {(Object.entries(featureFlags) as [FeatureFlag, boolean][]).map(([flag, value]) => (
                <label key={flag} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{flag.replace('ENABLE_', '').split('_').join(' ').toLowerCase()}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFeatureFlag(flag, e.target.checked)}
                    className="h-5 w-5 accent-[#7c3aed]"
                    aria-label={`Toggle ${flag}`}
                  />
                </label>
              ))}
            </div>
          </div>
        </details>

        {/* Authority integration panel — providers + demo report form */}
        {featureFlags.ENABLE_AUTHORITY_INTEGRATION && <AuthorityPanel />}

        <Row icon={Info} label="About Pujo Sahayak" onClick={() => note('v0.1 demo build • See the Puja. Understand the story.')} />
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-night px-4 py-2 text-xs text-on-image shadow-lift">
          {toast}
        </div>
      )}
    </Page>
  )
}
