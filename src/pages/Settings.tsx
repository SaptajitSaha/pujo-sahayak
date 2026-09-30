import { useState } from 'react'
import {
  ArrowRight, Bell, CircleHelp, Globe, Image as ImageIcon, Info, Lock, MapPin, Palette, Phone, Shield, Sparkles as SparkleRow, User,
} from 'lucide-react'
import { BackHeader, Card, Chip, Logo, Page } from '../components/ui'
import { CITIES } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { City, Lang, Theme } from '../data/types'

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
  const premium = useApp((s) => s.premium)
  const setPremium = useApp((s) => s.setPremium)
  const trustedContacts = useApp((s) => s.trustedContacts)
  const setTrustedContacts = useApp((s) => s.setTrustedContacts)
  const selectedCity = useApp((s) => s.selectedCity)
  const setSelectedCity = useApp((s) => s.setSelectedCity)
  const tithiDemoMode = useApp((s) => s.tithiDemoMode)
  const setTithiDemoMode = useApp((s) => s.setTithiDemoMode)

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
    setTrustedContacts([{ id: 'tc-' + Date.now(), name, phone }])
    note('Trusted contact saved. Shown in SOS.')
  }
  const clearContact = () => { setTrustedContacts([]); setContactName(''); setContactPhone(''); note('Trusted contact removed.') }

  const Row = ({ icon: Icon, label, value, onClick }: { icon: typeof User; label: string; value?: string; onClick?: () => void }) => (
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

      <div className="space-y-2">
        <Row icon={User} label="Account" onClick={() => note('Accounts & phone-OTP login arrive with the backend.')} />
        <Row icon={Shield} label="Privacy" onClick={() => note('Location & photo data stay on this device in the demo.')} />
        <Row icon={Lock} label="Security" onClick={() => note('Security options arrive with the backend.')} />
        <Row icon={Bell} label="Notifications" onClick={() => note('Crowd & puja alerts arrive with the backend.')} />

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

        {/* Trusted contact — SOS long-press shares your location with this
            number via the OS share sheet. Persisted locally; multi-contact
            support is a backend concern. */}
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><Phone size={15} /></span>
            <span className="flex-1 text-sm font-medium">{t('trustedContact')}</span>
          </div>
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
                {trustedContacts.length ? 'Update' : 'Save'}
              </button>
              {trustedContacts.length > 0 && (
                <button onClick={clearContact} className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink-soft">
                  Remove
                </button>
              )}
            </div>
            {trustedContacts[0] && (
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

        <Row icon={SparkleRow} label={premium ? 'Premium — active (demo)' : t('premiumMember')} onClick={() => { setPremium(!premium); note(premium ? 'Switched back to Free Plan (demo).' : 'Premium unlocked locally — demo only, no payment.')}} />
        <Row icon={Info} label="About Pujo Sahayak" onClick={() => note('v0.1 demo build • See the Puja. Understand the story.')} />
        <Row icon={CircleHelp} label="Help & Support" onClick={() => note('Support inbox arrives with the backend.')} />
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-night px-4 py-2 text-xs text-on-image shadow-lift">
          {toast}
        </div>
      )}
    </Page>
  )
}
