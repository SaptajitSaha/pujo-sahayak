import { useState } from 'react'
import { BadgeCheck, Check, Crown, Sparkles, Users, Zap } from 'lucide-react'
import { BackHeader, Button, Card, Page, Reveal } from '../components/ui'
import { useApp } from '../store'
import { useT } from '../i18n'

/**
 * Premium / upgrade screen. Previously the Profile "Upgrade to Premium" card
 * dumped straight into the generic Settings page; this is its own surface so
 * the upgrade flow reads as an intentional destination.
 *
 * Honesty (§ data-integrity): Premium is a UI concept in this build — no
 * payment is processed and nothing is charged. The toggle flips the local
 * `premium` flag (same store field Settings exposes) so the flow is reviewable
 * end-to-end without a billing backend. Keep the disclaimer truthful.
 */
const PERKS = [
  { icon: Sparkles, title: 'Smart outing plans', body: 'Best-time suggestions and a tighter day plan.' },
  { icon: Users, title: 'Exclusive meetups', body: 'Priority visibility in the social matching circles.' },
  { icon: Zap, title: 'Priority Maya', body: 'Fast-track answers during the busy puja days.' },
]

export default function Premium() {
  const t = useT()
  const premium = useApp((s) => s.premium)
  const setPremium = useApp((s) => s.setPremium)
  const [note, setNote] = useState<string | null>(null)

  const toggle = () => {
    const next = !premium
    setPremium(next)
    setNote(next ? 'Premium unlocked locally — demo only, no payment taken.' : 'Switched back to the Free Plan.')
    setTimeout(() => setNote(null), 2600)
  }

  return (
    <Page>
      <BackHeader title={t('upgrade')} />

      {/* Current plan status */}
      <Reveal>
        <Card className="flex items-center gap-3 bg-gradient-to-r from-night to-night-soft p-4 text-on-image">
          <span className="rounded-full bg-gold/20 p-2.5 text-gold-bright">
            {premium ? <BadgeCheck size={20} /> : <Crown size={20} />}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{premium ? 'Premium Member' : 'Free Plan'}</p>
            <p className="text-[11px] text-on-image/60">
              {premium ? 'All premium perks are active.' : t('upgradeSub')}
            </p>
          </div>
        </Card>
      </Reveal>

      {/* What Premium includes */}
      <section className="mt-5">
        <h2 className="font-display mb-2.5 text-[17px] font-semibold leading-tight text-ink">What Premium includes</h2>
        <div className="space-y-2">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="flex items-start gap-3 p-3.5">
              <span className="mt-0.5 rounded-full bg-gold/15 p-2 text-gold"><Icon size={16} /></span>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {title}
                  {premium && <Check size={14} className="text-vermilion" />}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-faint">{body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Action */}
      <div className="mt-5">
        <Button variant={premium ? 'outline' : 'primary'} className="w-full" onClick={toggle}>
          {premium ? 'Switch back to Free' : t('premiumMember')}
        </Button>
        {note && (
          <p role="status" className="mt-2 text-center text-xs text-ink-soft">{note}</p>
        )}
      </div>

      <p className="mt-4 text-center text-[10px] text-faint">
        Premium is a UI concept in this build — no transaction is processed and nothing is charged.
      </p>
    </Page>
  )
}
