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
  { icon: Sparkles, title: 'perkSmartPlans', body: 'perkSmartPlansBody' },
  { icon: Users, title: 'perkMeetups', body: 'perkMeetupsBody' },
  { icon: Zap, title: 'perkMaya', body: 'perkMayaBody' },
] as const

export default function Premium() {
  const t = useT()
  const premium = useApp((s) => s.premium)
  const setPremium = useApp((s) => s.setPremium)
  const [note, setNote] = useState<string | null>(null)

  const toggle = () => {
    const next = !premium
    setPremium(next)
    setNote(next ? t('premiumUnlocked') : t('premiumReverted'))
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
            <p className="text-sm font-semibold">{premium ? t('premiumActive') : t('premiumFreePlan')}</p>
            <p className="text-[11px] text-on-image/60">
              {premium ? t('premiumActiveSub') : t('upgradeSub')}
            </p>
          </div>
        </Card>
      </Reveal>

      {/* What Premium includes */}
      <section className="mt-5">
        <h2 className="font-display mb-2.5 text-[17px] font-semibold leading-tight text-ink">{t('premiumIncludes')}</h2>
        <div className="space-y-2">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="flex items-start gap-3 p-3.5">
              <span className="mt-0.5 rounded-full bg-gold/15 p-2 text-gold"><Icon size={16} /></span>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {t(title)}
                  {premium && <Check size={14} className="text-vermilion" />}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-faint">{t(body)}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Action */}
      <div className="mt-5">
        <Button variant={premium ? 'outline' : 'primary'} className="w-full" onClick={toggle}>
          {premium ? t('premiumSwitchFree') : t('premiumMember')}
        </Button>
        {note && (
          <p role="status" className="mt-2 text-center text-xs text-ink-soft">{note}</p>
        )}
      </div>

      <p className="mt-4 text-center text-[10px] text-faint">{t('premiumUiNote')}</p>
    </Page>
  )
}
