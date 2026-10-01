import { useEffect, useState } from 'react'
import { ChevronDown, Share2, Volume2, VolumeX } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, SectionHeader } from './ui'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { Place } from '../data/types'

interface Chapter { title: string; body: string }

/**
 * Story Mode — a chaptered, read-it-your-pace expander assembled only from the
 * place's own record (story / storyBn / theme / artist / pastEditions). Chapters
 * are revealed inline (display-only, no store slice). Text-share uses the Web
 * Share API; read-aloud uses the browser's own speech synthesis where it exists.
 * Nothing is narrated that isn't already in the record — no fabricated prose.
 */
export function StoryMode({ place }: { place: Place }) {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const reduce = useReducedMotion()
  const [revealed, setRevealed] = useState(1)
  const [speaking, setSpeaking] = useState(false)

  const storyBody = lang === 'bn' && place.storyBn ? place.storyBn : place.story
  const chapters: Chapter[] = []
  if (storyBody?.trim()) chapters.push({ title: t('storyChOrigin'), body: storyBody })
  if (place.theme?.trim()) chapters.push({ title: t('storyChTheme'), body: place.theme })
  if (place.artist?.trim()) chapters.push({ title: t('storyChArtist'), body: place.artist })
  if (place.pastEditions?.length) {
    chapters.push({
      title: t('storyChThenNow'),
      body: place.pastEditions.map((e) => `${e.year}: ${e.theme}`).join('  ·  '),
    })
  }

  // Stop any speech when the component unmounts or a chapter is re-read.
  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [])

  if (!chapters.length) return null
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const allText = chapters.map((c) => `${c.title}. ${c.body}`).join('\n\n')

  const share = () => {
    const msg = `${place.name} — ${t('storyModeTitle')}\n\n${allText}`
    if (navigator.share) navigator.share({ title: place.name, text: msg }).catch(() => {})
    else navigator.clipboard?.writeText(msg).then(() => navigator.vibrate?.(30))
  }

  const toggleRead = () => {
    if (!speechSupported) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const u = new SpeechSynthesisUtterance(allText)
    u.lang = lang === 'bn' ? 'bn-BD' : 'en-IN'
    u.onend = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(u)
  }

  return (
    <section className="mt-5">
      <SectionHeader title={t('storyModeTitle')} />
      <Card className="p-3.5">
        <div className="space-y-3">
          {chapters.slice(0, revealed).map((c, i) => (
            <motion.div
              key={c.title}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs font-semibold text-vermilion">{i + 1}. {c.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{c.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {revealed < chapters.length && (
            <button
              onClick={() => setRevealed((r) => Math.min(chapters.length, r + 1))}
              className="inline-flex items-center gap-1 rounded-full bg-vermilion/10 px-3 py-1.5 text-xs font-medium text-vermilion"
            >
              {t('storyContinue')} <ChevronDown size={13} />
            </button>
          )}
          <span className="text-[11px] text-faint">
            {t('storyProgress')} {Math.min(revealed, chapters.length)}/{chapters.length}
          </span>
          <div className="ml-auto flex gap-2">
            {speechSupported && (
              <button onClick={toggleRead} aria-pressed={speaking} className="inline-flex items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1.5 text-xs text-ink-soft">
                {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />} {speaking ? t('storyStopReading') : t('storyReadAloud')}
              </button>
            )}
            <button onClick={share} className="inline-flex items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1.5 text-xs text-ink-soft">
              <Share2 size={13} /> {t('storyShare')}
            </button>
          </div>
        </div>
      </Card>
    </section>
  )
}
