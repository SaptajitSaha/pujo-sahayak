import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, Baby, Bookmark, CalendarCheck, ChevronRight, CreditCard,
  HandHeart, Palette, Phone, Siren, Settings as SettingsIcon, Sparkles, Users,
} from 'lucide-react'
import { Card, Img, Page, SectionHeader } from '../components/ui'
import { useApp } from '../store'
import { useT } from '../i18n'

export default function Profile() {
  const t = useT()
  const nav = useNavigate()
  const saved = useApp((s) => s.saved)
  const visited = useApp((s) => s.visited)
  const joined = useApp((s) => s.joinedMeetups)
  const premium = useApp((s) => s.premium)

  return (
    <Page>
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('profile')}</h1>
        <button aria-label="Settings" onClick={() => nav('/profile/settings')} className="text-ink-soft"><SettingsIcon size={18} /></button>
      </header>

      {/* Identity */}
      <div className="mt-4 flex items-center gap-3">
        <Img palette={{ from: '#8E5A2E', to: '#4A2A12' }} alt="Your avatar" className="h-14 w-14 rounded-full" />
        <div>
          <p className="text-base font-semibold">You</p>
          <p className="text-xs text-faint">Kolkata</p>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${premium ? 'bg-gold text-white' : 'bg-ivory-deep text-gold'}`}>
            <BadgeCheck size={11} /> {premium ? 'Premium Member' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* Stats — from real local activity only */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { n: visited.length, label: 'Visits', icon: CalendarCheck },
          { n: saved.length, label: 'Saved', icon: Bookmark },
          { n: joined.length, label: 'Meets', icon: Users },
        ].map(({ n, label, icon: Icon }) => (
          <Card key={label} className="p-3">
            <p className="text-xl font-semibold">{n}</p>
            <p className="flex items-center justify-center gap-1 text-[11px] text-faint"><Icon size={11} /> {label}</p>
          </Card>
        ))}
      </div>

      {/* Premium CTA */}
      <button onClick={() => nav('/profile/settings')} className="mt-4 w-full text-left">
        <Card className="flex items-center gap-3 bg-gradient-to-r from-night to-night-soft p-3.5 text-on-image">
          <span className="rounded-full bg-gold/20 p-2 text-gold-bright"><Sparkles size={16} /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t('upgrade')}</p>
            <p className="text-[11px] text-on-image/60">{t('upgradeSub')}</p>
          </div>
          <ChevronRight size={16} className="text-gold-bright" />
        </Card>
      </button>

      {/* Emergency shortcuts — never buried (doc §31) */}
      <section className="mt-5">
        <SectionHeader title={t('emergency')} />
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Ambulance', icon: Phone },
            { label: 'Police', icon: Siren },
            { label: 'Women', icon: BadgeCheck },
            { label: 'Child', icon: Baby },
          ].map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => nav('/safety')} className="flex flex-col items-center gap-1.5 rounded-card bg-card p-3 shadow-card">
              <span className="rounded-full bg-vermilion-tint p-2.5 text-vermilion"><Icon size={16} /></span>
              <span className="text-[10px] text-ink-soft">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Rows */}
      <div className="mt-5 space-y-2">
        {[
          { icon: CalendarCheck, label: t('allVisits'), to: '/favorites' },
          { icon: CreditCard, label: 'Payments & Subscriptions', to: '/profile/settings' },
          { icon: HandHeart, label: 'Donate', to: '/profile/settings' },
          { icon: Palette, label: t('appearance'), to: '/profile/settings' },
          { icon: SettingsIcon, label: t('settings'), to: '/profile/settings' },
        ].map(({ icon: Icon, label, to }) => (
          <button key={label} onClick={() => nav(to)} className="w-full">
            <Card className="flex items-center gap-3 p-3.5">
              <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><Icon size={16} /></span>
              <span className="flex-1 text-left text-sm font-medium">{label}</span>
              <ArrowRight size={15} className="text-faint" />
            </Card>
          </button>
        ))}
        <button onClick={() => nav('/safety')}>
          <Card className="flex items-center gap-3 border border-vermilion/25 bg-vermilion-tint/50 p-3.5">
            <span className="rounded-full bg-vermilion p-2 text-on-image"><Siren size={16} /></span>
            <span className="flex-1 text-left text-sm font-semibold text-vermilion">{t('needHelp')}</span>
            <ArrowRight size={15} className="text-vermilion" />
          </Card>
        </button>
      </div>

      <p className="mt-4 text-center text-[10px] text-faint">
        Payments, donations & premium are UI concepts in this build — no transaction is processed.
      </p>
    </Page>
  )
}
