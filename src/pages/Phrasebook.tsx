import { useEffect, useMemo, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Chip, Page, SectionHeader } from '../components/ui'
import { phrases } from '../data/demo'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { Phrase } from '../data/types'

/**
 * Bengali Phrasebook — 24 cards grouped into five practical buckets.
 * Each card shows the English prompt, the Bangla script (rendered with
 * Noto Serif Bengali via the `bn` class), a Roman transliteration, and a
 * "Play" button that speaks the Bangla text via `speechSynthesis` at
 * `lang: 'bn-IN'` — the same path Maya uses. Falls back silently if the
 * voice isn't installed on the device.
 */
const GROUPS: { id: Phrase['category']; label: string; labelBn: string }[] = [
  { id: 'greetings', label: 'Greetings',       labelBn: 'শুভেচ্ছা' },
  { id: 'pandal',    label: 'At the Pandal',   labelBn: 'প্যান্ডেলে' },
  { id: 'food',      label: 'At the Food Stall', labelBn: 'খাবারের স্টলে' },
  { id: 'transit',   label: 'Transit',         labelBn: 'যাতায়াত' },
  { id: 'help',      label: 'Asking for Help', labelBn: 'সাহায্য চাওয়া' },
]

export default function Phrasebook() {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const [group, setGroup] = useState<Phrase['category'] | 'all'>('all')
  const [playing, setPlaying] = useState<string | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // Pick the best Bangla voice once — Android ships `bn-IN`, iOS ships `bn-BD`
  // when the language pack is installed, else we fall back to en-IN with the
  // raw script (still useful for the visual card).
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return
    const pick = () => {
      const voices = speechSynthesis.getVoices()
      voiceRef.current =
        voices.find((v) => v.lang?.toLowerCase().startsWith('bn')) ??
        voices.find((v) => v.lang?.toLowerCase() === 'en-in') ??
        null
    }
    pick()
    speechSynthesis.addEventListener?.('voiceschanged', pick)
    return () => speechSynthesis.removeEventListener?.('voiceschanged', pick)
  }, [])

  // Cancel any pending speech when we leave the page.
  useEffect(() => () => speechSynthesis?.cancel(), [])

  const list = useMemo(
    () => (group === 'all' ? phrases : phrases.filter((p) => p.category === group)),
    [group],
  )

  const play = (ph: Phrase) => {
    if (typeof speechSynthesis === 'undefined') return
    if (playing === ph.id) {
      speechSynthesis.cancel()
      setPlaying(null)
      return
    }
    speechSynthesis.cancel()
    // Speak the Bangla script when a bn-voice is available; otherwise speak
    // the transliteration with an Indian-English voice so it still sounds
    // close to home.
    const bnVoice = voiceRef.current?.lang?.toLowerCase().startsWith('bn')
    const u = new SpeechSynthesisUtterance(bnVoice ? ph.bangla : ph.transliteration)
    u.lang = bnVoice ? 'bn-IN' : 'en-IN'
    if (voiceRef.current) u.voice = voiceRef.current
    u.onend = () => setPlaying(null)
    u.onerror = () => setPlaying(null)
    setPlaying(ph.id)
    speechSynthesis.speak(u)
  }

  return (
    <Page>
      <h1 className="text-xl font-semibold">{t('phrasebook')}</h1>
      <p className="mt-1 text-xs text-faint">{t('phrasebookSub')}</p>

      {/* Group selector */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={group === 'all'} onClick={() => setGroup('all')}>All</Chip>
        {GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {lang === 'bn' ? g.labelBn : g.label}
          </Chip>
        ))}
      </div>

      {/* Phrase cards — a compact stacked list to keep it scannable */}
      <div className="mt-4 space-y-2.5">
        {list.map((ph) => (
          <div
            key={ph.id}
            className={`glass rounded-card p-3 shadow-card transition ${playing === ph.id ? 'ring-2 ring-vermilion' : ''}`}
          >
            <p className="text-[10px] uppercase tracking-wide text-faint">
              {GROUPS.find((g) => g.id === ph.category)?.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{ph.english}</p>
            <p className="bn mt-1.5 font-display text-[19px] leading-tight text-ink">{ph.bangla}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="italic text-[12px] text-ink-soft">{ph.transliteration}</p>
              <button
                onClick={() => play(ph)}
                aria-label={`Play pronunciation: ${ph.english}`}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                  playing === ph.id
                    ? 'bg-vermilion text-white animate-pulse'
                    : 'bg-vermilion-tint text-vermilion active:scale-95'
                }`}
              >
                <Volume2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <SectionHeader title="About the audio" />
      <p className="text-[10px] leading-relaxed text-faint">
        TTS uses the device's built-in Bengali voice when present (Android ships one under
        <span className="bn"> বাংলা </span>
        settings; iOS needs the Bangla language pack downloaded). Without a voice, the card falls back
        to the Roman transliteration read by the Indian-English voice — never silent.
      </p>
    </Page>
  )
}
