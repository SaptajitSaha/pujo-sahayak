import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EASE, Logo } from '../components/ui'
import { useT } from '../i18n'

/** Full-bleed night splash — lamp glow, wordmark, tagline (mockup 1). */
export default function Splash() {
  const t = useT()
  const nav = useNavigate()
  useEffect(() => {
    const id = setTimeout(() => nav('/', { replace: true }), 3200)
    return () => clearTimeout(id)
  }, [nav])

  return (
    <button
      onClick={() => nav('/', { replace: true })}
      className="grain relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-night text-on-image"
      aria-label="Enter Pujo Sahayak"
    >
      {/* vermillion dusk + lamp glow */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_115%,rgba(196,52,33,0.55),transparent_60%)]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_20%,rgba(243,197,102,0.14),transparent_70%)]"
        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* stylised alpana ring — spins slowly and scales in */}
      <motion.svg
        viewBox="0 0 200 200" className="absolute h-[420px] w-[420px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.09, scale: 1, rotate: 360 }}
        transition={{ opacity: { duration: 1.4 }, scale: { duration: 1.6, ease: EASE }, rotate: { duration: 90, repeat: Infinity, ease: 'linear' } }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <path key={i} d="M100 18 C 112 42 112 58 100 82 C 88 58 88 42 100 18 Z" fill="#F3C566" transform={`rotate(${i * 30} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="92" fill="none" stroke="#F3C566" strokeWidth="0.5" />
      </motion.svg>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo springs in with a settle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
        >
          <Logo size={84} className="rounded-2xl shadow-lift" />
        </motion.div>

        {/* Wordmark rises out of a blur */}
        <motion.h1
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
          className="mt-5 font-display text-4xl tracking-wide"
        >
          Pujo Sahayak
        </motion.h1>

        {/* Gold divider draws outward */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.6, ease: EASE }}
          className="mt-3 h-px w-28 origin-center bg-gradient-to-r from-transparent via-gold-bright to-transparent"
        />

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.6, ease: EASE }}
          className="mt-3 text-sm text-on-image/60"
        >
          {t('tagline')}
        </motion.p>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.5, 0] }}
        transition={{ delay: 1.6, duration: 2.4, repeat: Infinity }}
        className="absolute bottom-8 text-[11px] text-on-image/50"
      >
        tap anywhere to enter
      </motion.p>
    </button>
  )
}
