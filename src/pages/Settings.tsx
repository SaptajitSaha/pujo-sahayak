import { useState } from 'react'
import {
  ArrowRight, Bell, CircleHelp, Globe, Image as ImageIcon, Info, Lock, Palette, Shield, Sparkles as SparkleRow, User,
} from 'lucide-react'
import { BackHeader, Card, Chip, Logo, Page } from '../components/ui'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { Lang, Theme } from '../data/types'

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

  const note = (s: string) => { setToast(s); setTimeout(() => setToast(null), 2200) }

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
