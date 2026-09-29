import { motion, useReducedMotion } from 'framer-motion'
import { EASE, Logo } from './ui'

/* ── First-open brand intro ────────────────────────────────────────────────
   Shown once on cold start as a full-screen overlay over Home, so the ~1s of
   first paint / font load is covered by a festive greeting (animated diyas +
   "শুভ শারদীয়া"). It dissolves to reveal the app. Reduced-motion → a brief,
   still fade with no flicker. Presentational only: App owns the timing and
   unmounts it (via AnimatePresence); onSkip lets the user dismiss early. */

function Diya({ delay = 0, reduce = false, size = 1 }: { delay?: number; reduce?: boolean; size?: number }) {
  const flame = reduce
    ? {}
    : {
        animate: { scaleY: [1, 0.82, 1.12, 0.9, 1], scaleX: [1, 1.08, 0.94, 1.04, 1], opacity: [0.9, 1, 0.85, 1, 0.92] },
        transition: { duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay },
      }
  return (
    <div className="flex flex-col items-center" style={{ transform: `scale(${size})` }}>
      {/* flame — layered teardrop with a warm core */}
      <motion.div
        className="relative mb-[-2px] h-[22px] w-[11px] origin-bottom"
        style={{
          borderRadius: '50% 50% 46% 46% / 64% 64% 36% 36%',
          background: 'radial-gradient(60% 60% at 50% 72%, #fff6d8 0%, #ffd479 34%, #ff9a2e 66%, rgba(255,90,20,0) 100%)',
          filter: 'drop-shadow(0 0 10px rgba(255,150,40,0.75))',
        }}
        initial={{ opacity: 0, scaleY: 0.2 }}
        animate={reduce ? { opacity: 1, scaleY: 1 } : flame.animate}
        transition={reduce ? { duration: 0.4, delay } : { ...flame.transition, ...(reduce ? {} : {}) }}
      />
      {/* oil sheen + flame glow above the wick */}
      <div
        className="pointer-events-none absolute -mt-8 h-12 w-12 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,170,60,0.4), transparent 70%)' }}
      />
      {/* clay lamp bowl */}
      <svg width="42" height="18" viewBox="0 0 42 18" className="relative z-10">
        <path d="M2 4 Q21 20 40 4 Q40 4 40 4 Z" fill="#7a3717" />
        <ellipse cx="21" cy="4.5" rx="19" ry="3.2" fill="#b4551f" />
        <ellipse cx="21" cy="4.2" rx="19" ry="3.2" fill="none" stroke="#e88a3a" strokeWidth="0.6" opacity="0.7" />
        <rect x="20" y="0.5" width="2" height="4.5" rx="1" fill="#2b1608" />
      </svg>
    </div>
  )
}

export function Intro({ onSkip }: { onSkip: () => void }) {
  const reduce = useReducedMotion() || false

  return (
    <motion.div
      role="dialog"
      aria-label="Pujo Sahayak — Subho Sharadiya"
      onClick={onSkip}
      className="grain fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-night text-on-image"
      // Soft dissolve that reveals the app already rendered behind it.
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.03 }}
      transition={{ duration: reduce ? 0.25 : 0.6, ease: EASE }}
    >
      {/* dusk + lamp-glow wash */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_118%,rgba(124,58,237,0.5),transparent_62%)]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1 }}
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_18%,rgba(243,197,102,0.16),transparent_72%)]"
      />

      {/* faint alpana ring rotating behind the wordmark */}
      <motion.svg
        viewBox="0 0 200 200" className="pointer-events-none absolute h-[440px] w-[440px]"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.1, scale: 1, rotate: reduce ? 0 : 360 }}
        transition={{
          opacity: { duration: 1.2 },
          scale: { duration: 1.4, ease: EASE },
          rotate: { duration: 90, repeat: Infinity, ease: 'linear' },
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d="M100 14 C 111 40 111 56 100 80 C 89 56 89 40 100 14 Z" fill="#F3C566" transform={`rotate(${i * 22.5} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="94" fill="none" stroke="#F3C566" strokeWidth="0.5" />
      </motion.svg>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        >
          <Logo size={82} className="rounded-2xl shadow-lift" />
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
          className="mt-5 font-display text-[34px] leading-none tracking-wide"
        >
          Pujo Sahayak
        </motion.h1>

        <motion.div
          initial={reduce ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6, ease: EASE }}
          className="mt-3 h-px w-28 origin-center bg-gradient-to-r from-transparent via-gold-bright to-transparent"
        />

        {/* festive greeting — Bengali + romanisation */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6, ease: EASE }}
          className="mt-5 flex flex-col items-center"
        >
          <span className="bn text-[26px] font-semibold text-gold-bright" lang="bn">শুভ শারদীয়া</span>
          <span className="mt-1 text-[13px] uppercase tracking-[0.3em] text-on-image/70">Subho Sharadiya</span>
        </motion.div>

        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-4 text-sm text-on-image/60"
        >
          See the Puja. Understand the story.
        </motion.p>
      </div>

      {/* a row of lit diyas along the base */}
      <div className="absolute bottom-12 z-10 flex items-end gap-6 sm:gap-8">
        {[0, 0.15, 0.3, 0.2, 0.05].map((d, i) => (
          <Diya key={i} delay={d} reduce={reduce} size={i === 2 ? 1.15 : 0.92} />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? 0.4 : [0, 0.45, 0.45, 0] }}
        transition={{ delay: 1.4, duration: 2.4, repeat: reduce ? 0 : Infinity }}
        className="absolute bottom-4 z-10 text-[11px] text-on-image/45"
      >
        tap to skip
      </motion.p>
    </motion.div>
  )
}
