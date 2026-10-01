import { Camera, Sun, Aperture, Users } from 'lucide-react'
import { Card, SectionHeader } from './ui'
import { useT } from '../i18n'
import type { Place } from '../data/types'

/**
 * Photo Guide — honest tips derived from facts the place already has: gate-open
 * and pre-close hours (for light), the theme (for what to frame), and the crowd
 * level (the photo-vs-crowd tradeoff). These are suggestions drawn from the
 * record, never invented "best photo spot" coordinates.
 */
export function PhotoGuide({ place }: { place: Place }) {
  const t = useT()
  const tips: { icon: typeof Sun; text: string }[] = []

  if (place.openTill) {
    tips.push({ icon: Sun, text: `Light is even just after the gates open and again as the fairground lights come up before it closes around ${place.openTill}.` })
  }
  if (place.theme) {
    tips.push({ icon: Aperture, text: `With a "${place.theme}" theme, frame the storytelling details and the idol up close, not just the full facade.` })
  }
  if (place.crowd === 'high') {
    tips.push({ icon: Users, text: 'Peak crowd — expect people in frame. Shoot details, lighting and the idol rather than wide empty shots.' })
  } else if (place.crowd === 'low') {
    tips.push({ icon: Users, text: 'Calmer crowds — you have room for clean wide shots of the pandal front.' })
  }

  if (!tips.length) return null

  return (
    <section className="mt-5">
      <SectionHeader title={t('photoTitle')} />
      <Card className="divide-y divide-ink/5 p-0">
        {tips.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-2.5 p-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vermilion/10 text-vermilion"><Icon size={13} /></span>
            <p className="text-[13px] leading-relaxed text-ink-soft">{text}</p>
          </div>
        ))}
      </Card>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-faint">
        <Camera size={10} /> {t('photoSub')}
      </p>
    </section>
  )
}
