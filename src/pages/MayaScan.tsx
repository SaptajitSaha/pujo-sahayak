import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flashlight, ImageUp, Sparkles, X } from 'lucide-react'
import { Button, Card, Img, MayaMark } from '../components/ui'
import { identifyDemo } from '../maya/brain'
import type { Place } from '../data/types'
import { useT } from '../i18n'

export default function MayaScan() {
  const t = useT()
  const nav = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<'starting' | 'live' | 'denied'>('starting')
  const [result, setResult] = useState<Place | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setState('live')
      })
      .catch(() => setState('denied'))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
    }
  }, [])

  const capture = () => {
    setScanning(true)
    setResult(null)
    // Demo pipeline: visual-embedding match is simulated (honest, doc §58).
    setTimeout(() => {
      setScanning(false)
      setResult(identifyDemo())
    }, 1900)
  }

  return (
    <div className="grain relative mx-auto flex h-dvh max-w-lg flex-col bg-night text-on-image">
      {/* Camera layer */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      {state !== 'live' && (
        <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_40%,#2a1a10,#120c08)]" />
      )}

      {/* Top bar — clears the Android status bar via the safe-area inset */}
      <header
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        className="relative z-10 flex items-center justify-between px-4 pb-4"
      >
        <button onClick={() => nav('/maya')} aria-label="Close scanner" className="rounded-full bg-night/60 p-2">
          <X size={18} />
        </button>
        <div className="flex items-center gap-2 rounded-full bg-night/60 px-3 py-1.5 text-sm">
          <MayaMark size={20} />
          Scan & Identify
        </div>
      </header>

      {/* Scan frame */}
      <div className="relative z-10 mx-auto mt-16 h-64 w-64">
        <Corner className="-left-1 -top-1 border-l-2 border-t-2" />
        <Corner className="-right-1 -top-1 border-r-2 border-t-2" />
        <Corner className="-bottom-1 -left-1 border-b-2 border-l-2" />
        <Corner className="-bottom-1 -right-1 border-b-2 border-r-2" />
        <motion.div
          className="absolute inset-x-2 h-[2px] bg-gold-bright/80 shadow-[0_0_12px_2px_rgba(243,197,102,0.6)]"
          animate={{ top: ['4%', '96%', '4%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {scanning && (
          <p className="absolute -bottom-8 w-full text-center text-xs text-gold-bright">
            <Sparkles size={12} className="mr-1 inline animate-pulse" /> Comparing against known pandals…
          </p>
        )}
      </div>

      {state === 'denied' && (
        <p className="relative z-10 mx-8 mt-10 rounded-card bg-night/70 p-3 text-center text-xs text-on-image/80">
          Camera permission is needed to identify pandals. You can still try the demo match below.
        </p>
      )}
      <p className="relative z-10 mt-10 text-center text-sm text-on-image/80">
        {state === 'starting' ? 'Starting camera…' : 'Point your camera at a pandal'}
      </p>

      {/* Result card */}
      {result && (
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-10 mx-4 mt-4">
          <Card className="flex items-center gap-3 bg-card p-3 text-ink">
            <Img palette={result.palette} alt={result.name} className="h-14 w-14 rounded-lg" />
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wide text-maya">Possible match · demo identification</p>
              <p className="text-sm font-semibold">{result.name}</p>
              <p className="text-xs text-ink-soft">{result.area} • Theme: {result.theme}</p>
            </div>
            <Button size="sm" onClick={() => nav(`/pandal/${result.id}`)}>{t('viewDetails')}</Button>
          </Card>
        </motion.div>
      )}

      {/* Controls */}
      <div className="relative z-10 mt-auto flex items-center justify-around p-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <button className="flex flex-col items-center gap-1 text-[11px] text-on-image/80">
          <span className="rounded-full bg-night/60 p-3"><ImageUp size={18} /></span> Gallery
        </button>
        <button
          onClick={capture}
          aria-label="Capture and identify"
          className="grid h-16 w-16 place-items-center rounded-full border-4 border-on-image/90 bg-transparent transition-transform active:scale-90"
        >
          <span className="h-12 w-12 rounded-full bg-on-image" />
        </button>
        <button className="flex flex-col items-center gap-1 text-[11px] text-on-image/80">
          <span className="rounded-full bg-night/60 p-3"><Flashlight size={18} /></span> Flash
        </button>
      </div>
    </div>
  )
}

function Corner({ className }: { className: string }) {
  return <span className={`absolute h-6 w-6 rounded-[4px] border-gold-bright ${className}`} />
}
