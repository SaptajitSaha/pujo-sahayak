import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, ChevronRight, Mic, Play, Square } from 'lucide-react'
import { MayaMark, Page } from '../components/ui'
import { placeById } from '../data/demo'
import { askMaya, type ChatTurn } from '../maya'
import { useApp } from '../store'
import type { Place } from '../data/types'

interface Msg {
  from: 'user' | 'maya'
  text: string
  textBn?: string
  chips?: string[]
  audio?: boolean
}

/** Reactive waveform (doc §49) — animates while speech plays. */
export function Waveform({ playing, bars = 22, className = '' }: { playing: boolean; bars?: number; className?: string }) {
  return (
    <span className={`inline-flex h-4 items-center gap-[2px] ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-current"
          animate={playing ? { height: [3, 12, 5, 14, 4, 10, 3] } : { height: 4 }}
          transition={playing ? { duration: 0.9, repeat: Infinity, delay: i * 0.045 } : { duration: 0.2 }}
        />
      ))}
    </span>
  )
}

export default function Maya() {
  const nav = useNavigate()
  const loc = useLocation()
  const lang = useApp((s) => s.lang)
  const ctx: Place | null = (loc.state as { placeId?: string } | null)?.placeId
    ? placeById((loc.state as { placeId: string }).placeId) ?? null
    : null

  const [msgs, setMsgs] = useState<Msg[]>(() =>
    ctx
      ? [{ from: 'maya', text: `You're asking about ${ctx.name}. What would you like to know — the theme, the story, or what's nearby?`, chips: ['What is special about this place?', 'Nearest Metro?', 'Where can I eat nearby?'] }]
      : [{ from: 'maya', text: 'Namaskar! I am Maya. Ask me about pandals, themes, routes, food or safety in Kolkata.', chips: ['Help me plan my evening', 'Which pandals are less crowded?', 'Where is the nearest hospital?'] }],
  )
  const [input, setInput] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [msgs, typing])
  useEffect(() => () => speechSynthesis?.cancel(), [])

  const send = async (text: string) => {
    if (!text.trim()) return
    const turn = text.trim()
    const history: ChatTurn[] = msgs.map((m) => ({ from: m.from, text: m.text }))
    setMsgs((m) => [...m, { from: 'user', text: turn }])
    setInput('')
    setTyping(true)
    try {
      // Ask Maya (off-topic gate → optional LLM → offline brain fallback).
      // Promise.race against a 12-second safety timeout so the typing indicator
      // never strands if a network call hangs. The offline path always resolves
      // well inside that; if we time out we render a friendly fallback.
      const reply = await Promise.race([
        askMaya(turn, ctx, history),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('maya-timeout')), 12_000)),
      ])
      setMsgs((m) => [...m, { from: 'maya', ...reply }])
    } catch {
      setMsgs((m) => [...m, { from: 'maya', text: 'Sorry, that took too long. Could you rephrase?' }])
    } finally {
      setTyping(false)
    }
  }

  const onChip = (chip: string) => {
    if (chip === 'Open Puja Planner') return nav('/planner')
    if (chip === 'Open Safety Center') return nav('/safety')
    send(chip)
  }

  const speak = (m: Msg, idx: number) => {
    if (playingIdx === idx) { speechSynthesis.cancel(); setPlayingIdx(null); return }
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(m.textBn && lang !== 'en' ? m.textBn : m.text)
    u.lang = m.textBn && lang === 'bn' ? 'bn-IN' : 'en-IN'
    u.onend = () => setPlayingIdx(null)
    setPlayingIdx(idx)
    speechSynthesis.speak(u)
  }

  return (
    <Page className="!px-0 !pb-0 flex !min-h-[calc(100dvh-64px)] flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-ink/10 bg-card px-4 py-3">
        <button aria-label="Go back" onClick={() => nav(-1)} className="text-ink-soft">‹</button>
        <MayaMark size={36} />
        <div className="flex-1">
          <p className="text-sm font-semibold">Maya</p>
          <p className="text-[11px] text-emerald-600">● Online</p>
        </div>
        <button onClick={() => nav('/maya/scan')} aria-label="Scan a pandal with the camera" className="text-ink-soft">
          <Camera size={19} />
        </button>
      </header>
      {ctx && (
        <div className="flex items-center gap-2 bg-indigo-deep/5 px-4 py-1.5 text-xs text-maya">
          Context: <b>{ctx.name}</b> · {ctx.area}
        </div>
      )}

      {/* Thread */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {msgs.map((m, i) =>
          m.from === 'user' ? (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="flex justify-end"
            >
              <p className="bn max-w-[80%] rounded-card bg-night-soft px-3 py-2 text-sm text-on-image">{m.text}</p>
            </motion.div>
          ) : (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="max-w-[88%] space-y-2"
            >
              <div className="rounded-card border border-ink/5 bg-card p-3 text-sm leading-relaxed shadow-card">
                {m.textBn && lang === 'bn' ? <p className="bn">{m.textBn}</p> : <p>{m.text}</p>}
                {m.audio && (
                  <div className="mt-2 flex items-center gap-2 rounded-full bg-ivory-deep px-3 py-1.5">
                    <button
                      onClick={() => speak(m, i)}
                      aria-label={playingIdx === i ? 'Stop' : 'Play'}
                      className="grid h-6 w-6 place-items-center rounded-full bg-vermilion text-on-image transition-transform hover:scale-110 active:scale-90"
                    >
                      {playingIdx === i ? <Square size={10} className="fill-current" /> : <Play size={11} className="fill-current" />}
                    </button>
                    <Waveform playing={playingIdx === i} className="text-maya" />
                    <span className="ml-auto text-[10px] text-faint">0:45</span>
                  </div>
                )}
              </div>
              {m.chips && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
                  className="flex flex-wrap gap-2"
                >
                  {m.chips.map((c) => (
                    <motion.button
                      key={c}
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onChip(c)}
                      className="flex items-center gap-1 rounded-full border border-ink/10 bg-card px-3 py-1.5 text-xs text-ink-soft shadow-card hover:border-maya/40"
                    >
                      {c} <ChevronRight size={12} className="text-maya" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ),
        )}
        <AnimatePresence>
          {typing && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="max-w-[88%]"
            >
              <div className="inline-flex items-center gap-1.5 rounded-card border border-ink/5 bg-card px-3.5 py-3 shadow-card">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-2 w-2 rounded-full bg-maya/70"
                    animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.16, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-ink/10 bg-card px-4 py-3">
        {voiceMode ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <motion.span
              className="grid h-12 w-12 place-items-center rounded-full bg-vermilion text-on-image"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Mic size={20} />
            </motion.span>
            <p className="text-sm text-ink-soft">Listening… speak now <button className="ml-2 text-vermilion underline" onClick={() => { setVoiceMode(false); send('What is the theme of this pandal?') }}>try sample</button></p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); send(input) }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ctx ? `Ask about ${ctx.name}…` : 'Ask Maya…'}
              className="flex-1 rounded-full border border-ink/10 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-maya/50"
            />
            <button type="button" onClick={() => setVoiceMode(true)} aria-label="Voice input" className="grid h-10 w-10 place-items-center rounded-full bg-vermilion text-on-image glow-vermilion">
              <Mic size={17} />
            </button>
          </form>
        )}
      </div>
    </Page>
  )
}
