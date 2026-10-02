import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, Baby, Bookmark, CalendarCheck, ChevronRight,
  Flame, Lock, LogIn, MapPin, Notebook, Phone, Share2, Siren, Stamp, Settings as SettingsIcon, Sparkles, Users,
} from 'lucide-react'
import { Avatar, Button, Card, Page, SectionHeader } from '../components/ui'
import { Wallet } from '../components/Wallet'
import { MyOrders } from '../components/MyOrders'
import { PujaRecap, PujaStatsPanel } from '../components/PujaMemory'
import { walks } from '../data/demo'
import { useApp } from '../store'
import { evaluateBadges, scorecardSummary } from '../lib/scorecard'
import { useAuth, useUserId } from '../lib/auth'
import { useT } from '../i18n'

export default function Profile() {
  const t = useT()
  const nav = useNavigate()
  const saved = useApp((s) => s.saved)
  const visited = useApp((s) => s.visited)
  const joined = useApp((s) => s.joinedMeetups)
  const premium = useApp((s) => s.premium)
  const checkins = useApp((s) => s.checkins)
  const flags = useApp((s) => s.featureFlags)
  const [copied, setCopied] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const userId = useUserId()

  // Everything below is derived only from the user's own GPS-verified check-ins.
  const summary = scorecardSummary(checkins)
  const badges = evaluateBadges(checkins, walks)
  const earnedCount = badges.filter((b) => b.earned).length

  const shareScorecard = async () => {
    const text =
      `My Pujo Sahayak scorecard: ${summary.pandals} pandal check-in${summary.pandals === 1 ? '' : 's'} ` +
      `across ${summary.tithis} tith${summary.tithis === 1 ? 'i' : 'is'}, best streak ${summary.streak} ` +
      `day${summary.streak === 1 ? '' : 's'}, ${earnedCount}/${badges.length} badges.`
    if (navigator.share) {
      try { await navigator.share({ title: 'My Puja Scorecard', text }); return } catch { /* cancelled — fall through */ }
    }
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { /* clipboard unavailable */ }
  }

  return (
    <Page>
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('profile')}</h1>
      </header>

      {/* Identity */}
      <div className="mt-4 flex items-center gap-3">
        <Avatar name={isAuthenticated ? user?.email?.split('@')[0] : undefined} alt="Your avatar" className="h-14 w-14 rounded-full text-lg" />
        <div>
          <p className="text-base font-semibold">{isAuthenticated ? user?.email?.split('@')[0] : 'You'}</p>
          <p className="text-xs text-faint">{isAuthenticated ? 'Signed in' : 'Kolkata'}</p>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${premium ? 'bg-gold text-white' : 'bg-ivory-deep text-gold'}`}>
            <BadgeCheck size={11} /> {premium ? 'Premium Member' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* Keep urgent help within the first screenful instead of below the
          activity, memory, and commerce sections. */}
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

      {/* Stats — from real local activity only; each tile deep-links to the
          screen that shows the underlying items. */}
      <section className="mt-5">
        <SectionHeader title="Your activity" />
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: visited.length, label: 'Visits', icon: CalendarCheck, to: '/favorites' },
            { n: saved.length, label: 'Saved', icon: Bookmark, to: '/favorites' },
            { n: joined.length, label: 'Meets', icon: Users, to: '/meets' },
          ].map(({ n, label, icon: Icon, to }) => (
            <button key={label} onClick={() => nav(to)} aria-label={`${n} ${label} — open details`} className="text-center">
              <Card className="p-3 transition-transform hover:scale-[1.03]">
                <p className="text-xl font-semibold">{n}</p>
                <p className="flex items-center justify-center gap-1 text-[11px] text-faint"><Icon size={11} /> {label}</p>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {/* Scorecard — counts only what the user actually verified on-site. */}
      <section className="mt-5">
        <SectionHeader title="Your Puja Scorecard" />
        <Card className="p-4">
          {checkins.length === 0 ? (
            <p className="text-[13px] leading-snug text-ink-soft">
              No check-ins yet. When you reach a pandal, open it and tap{' '}
              <span className="font-medium">Check in here</span> — it confirms you’re on-site
              with GPS, then your visits count here.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { n: summary.pandals, label: 'Pandals', icon: MapPin },
                  { n: summary.tithis, label: 'Tithis', icon: CalendarCheck },
                  { n: summary.streak, label: 'Best streak', icon: Flame },
                ].map(({ n, label, icon: Icon }) => (
                  <div key={label}>
                    <p className="text-xl font-semibold">{n}</p>
                    <p className="flex items-center justify-center gap-1 text-[11px] text-faint"><Icon size={11} /> {label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {badges.map((b) => (
                  <div
                    key={b.def.id}
                    className={`rounded-lg border p-2.5 ${b.earned ? 'border-gold/40 bg-gold/10' : 'border-ink/10 opacity-70'}`}
                  >
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      {b.earned ? <BadgeCheck size={13} className="shrink-0 text-gold" /> : <Lock size={13} className="shrink-0 text-faint" />}
                      <span className="truncate">{b.def.label}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-faint">{b.def.hint}</p>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={shareScorecard}>
                <Share2 size={14} /> {copied ? 'Copied!' : 'Share scorecard'}
              </Button>
            </>
          )}
        </Card>
      </section>

      {/* Memory layer — each surface independently flag-gated (§Phase 4). */}
      {flags.ENABLE_PUJA_STATS && <PujaStatsPanel />}
      {flags.ENABLE_PUJA_RECAP && <PujaRecap />}

      {/* Personal records are grouped separately from commerce and account
          controls so the lower half of the page scans by purpose. */}
      {(flags.ENABLE_PUJA_PASSPORT || flags.ENABLE_PUJA_DIARY) && (
        <section className="mt-5">
          <SectionHeader title="Your Puja" />
          <div className="space-y-2">
            {flags.ENABLE_PUJA_PASSPORT && <ProfileRow icon={Stamp} label={t('passport')} onClick={() => nav('/passport')} />}
            {flags.ENABLE_PUJA_DIARY && <ProfileRow icon={Notebook} label={t('diary')} onClick={() => nav('/diary')} />}
          </div>
        </section>
      )}

      {/* Cross-feature commerce sections — each independently flag-gated. */}
      {(flags.ENABLE_MARKETPLACE || flags.ENABLE_WALLET) && (
        <section className="mt-5">
          <SectionHeader title="Orders & payments" />
          <div className="space-y-2">
            {flags.ENABLE_MARKETPLACE && <MyOrders />}
            {flags.ENABLE_WALLET && <Wallet userId={userId} />}
          </div>
        </section>
      )}

      {/* Premium — the single entry point to the plan surface. Hidden entirely
          when the flag is off (a disabled feature shows no UI), so there is no
          fallback link into Settings. */}
      {flags.ENABLE_PREMIUM && (
        <button onClick={() => nav('/premium')} className="mt-4 w-full text-left">
          <Card className="flex items-center gap-3 bg-gradient-to-r from-night to-night-soft p-3.5 text-on-image">
            <span className="rounded-full bg-gold/20 p-2 text-gold-bright"><Sparkles size={16} /></span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{premium ? t('premiumActive') : t('upgrade')}</p>
              <p className="text-[11px] text-on-image/60">{premium ? t('premiumManage') : t('upgradeSub')}</p>
            </div>
            <ChevronRight size={16} className="text-gold-bright" />
          </Card>
        </button>
      )}

      {/* Account controls stay together at the end; profile activity tiles
          already provide the visits and saved links, so don't repeat them. */}
      <section className="mt-5">
        <SectionHeader title="Account" />
        <div className="space-y-2">
          <ProfileRow icon={LogIn} label={isAuthenticated ? 'Account settings' : 'Sign in'} onClick={() => nav('/auth')} />
          <ProfileRow icon={SettingsIcon} label={t('settings')} onClick={() => nav('/profile/settings')} />
        </div>
      </section>

      <p className="mt-4 text-center text-[10px] text-faint">{t('commerceDemoNote')}</p>
    </Page>
  )
}

function ProfileRow({ icon: Icon, label, onClick }: { icon: typeof CalendarCheck; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="flex items-center gap-3 p-3.5">
        <span className="rounded-full bg-ivory-deep p-2 text-ink-soft"><Icon size={16} /></span>
        <span className="flex-1 text-sm font-medium">{label}</span>
        <ArrowRight size={15} className="text-faint" />
      </Card>
    </button>
  )
}
