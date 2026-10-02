import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Img } from './ui'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { Place } from '../data/types'

/**
 * Explore Spotlight — a 3D coverflow carousel. One card sits front-and-centre
 * with two cards peeking from each side, partly tucked behind the main card.
 * Auto-advances on an interval with a spring transition; tap a side card to
 * bring it forward, tap the centre card to open it. Freezes under reduced motion.
 */
export function SpotlightCarousel({ pool }: { pool: Place[] }) {
  const nav = useNavigate()
  const reduce = useApp((s) => s.reduceMotion)
  const rm = useReducedMotion()
  const featured = pool.slice(0, 6)
  const n = featured.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const dragX = useRef<number | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (reduce || rm || paused) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), 3600)
    return () => clearInterval(id)
  }, [reduce, rm, paused, n])

  const CARD = 236
  const signed = (i: number) => {
    let d = i - active
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    return d
  }
  const layout = (d: number) => {
    const sign = d > 0 ? 1 : -1
    if (d === 0) return { x: 0, scale: 1, z: 60, ry: 0, o: 1 }
    if (Math.abs(d) === 1) return { x: sign * CARD * 0.62, scale: 0.82, z: 34, ry: -sign * 22, o: 0.95 }
    if (Math.abs(d) === 2) return { x: sign * CARD * 1.08, scale: 0.64, z: 16, ry: -sign * 32, o: 0.55 }
    return { x: sign * CARD * 1.4, scale: 0.5, z: 0, ry: 0, o: 0 }
  }

  return (
    <div className="mt-1">
      <div
        className="relative h-[276px] w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        style={{ perspective: '1400px' }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => { setPaused(false); dragX.current = null }}
        onPointerDown={(e) => { dragX.current = e.clientX; moved.current = false; setPaused(true) }}
        onPointerMove={(e) => { if (dragX.current != null && Math.abs(e.clientX - dragX.current) > 8) moved.current = true }}
        onPointerUp={(e) => {
          if (dragX.current != null) {
            const dx = e.clientX - dragX.current
            if (dx < -45) setActive((a) => (a + 1) % n)
            else if (dx > 45) setActive((a) => (a - 1 + n) % n)
          }
          dragX.current = null
          setPaused(false)
        }}
      >
        {featured.map((p, i) => {
          const d = signed(i)
          const L = layout(d)
          const center = d === 0
          return (
            <motion.div
              key={p.id}
              className="absolute left-1/2 top-1/2"
              style={{ zIndex: L.z, width: CARD, marginLeft: -CARD / 2, marginTop: -128, pointerEvents: Math.abs(d) > 2 ? 'none' : 'auto' }}
              initial={false}
              animate={{ x: L.x, scale: L.scale, rotateY: L.ry, opacity: L.o }}
              transition={{ type: 'spring', stiffness: 240, damping: 26 }}
              onClick={() => { if (moved.current) return; center ? nav(`/pandal/${p.id}`) : setActive(i) }}
            >
              <SpotCard place={p} front={center} />
            </motion.div>
          )
        })}
      </div>

      {/* position dots — below the stage so cards never cover them */}
      <div className="mt-3 flex justify-center gap-1.5">
        {featured.map((p, i) => (
          <button
            key={p.id}
            aria-label={`Go to ${p.name}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-vermilion' : 'w-1.5 bg-ink/25 hover:bg-ink/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

/** Showcase card for the coverflow — real photo with a legible dark overlay. */
function SpotCard({ place, front }: { place: Place; front: boolean }) {
  const t = useT()
  return (
    <div className={`glass overflow-hidden rounded-card ${front ? 'shadow-lift' : 'shadow-card'}`}>
      <Img palette={place.palette} alt={place.name} className="grain h-64" priority>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/80 to-transparent p-3 pt-20">
          <div className="text-on-image [text-shadow:0_1px_10px_rgba(0,0,0,0.75)]">
            <h3 className="font-display text-lg">{place.name}</h3>
            <p className="text-xs text-on-image/90">Theme: {place.theme}</p>
            <p className="mt-1 text-xs text-on-image/90">★ {place.rating} • {place.distanceKm} km • {t('crowdModerate')}</p>
          </div>
        </div>
      </Img>
    </div>
  )
}
