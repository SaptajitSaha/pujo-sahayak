// ─── Shared UI — the mockups' design language as primitives ────────────────
import { motion, AnimatePresence, useInView, useMotionValue, useReducedMotion, useTransform, animate, type HTMLMotionProps } from 'framer-motion'
import { Children, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Bookmark, ChevronRight, Home, MapPin, Search, Star, Users, LayoutGrid, Heart, Moon, Sun } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import type { Palette } from '../data/types'
import { useApp } from '../store'
import { useT } from '../i18n'

/* Signature easing curve — soft overshoot settle, used across the app. */
export const EASE = [0.22, 1, 0.36, 1] as const

/* Scroll-into-view reveal — the core of the app's "come alive on scroll" feel. */
export function Reveal({
  children, delay = 0, y = 26, className = '', once = true,
}: { children: ReactNode; delay?: number; y?: number; className?: string; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once, margin: '-48px' })
  // Honour reduced-motion: show content immediately, no scroll-triggered fade.
  if (reduce) return <div ref={ref} className={className}>{children}</div>
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* Animated number that counts up when it scrolls into view. */
export function CountUp({ to, decimals = 0, suffix = '', className = '' }: { to: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => `${v.toFixed(decimals)}${suffix}`)
  useEffect(() => {
    if (inView && !reduce) {
      const controls = animate(mv, to, { duration: 0.9, ease: EASE })
      return () => controls.stop()
    }
  }, [inView, mv, to, reduce])
  if (reduce) return <span ref={ref} className={className}>{`${to.toFixed(decimals)}${suffix}`}</span>
  return <motion.span ref={ref} className={className}>{display}</motion.span>
}

/* Logo mark — SVG so the "App Logo" personalisation can swap variants */
export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  const appLogo = useApp((s) => s.appLogo)
  const gid = `logoGrad-${useId().replace(/[:]/g, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2d95" />
          <stop offset="52%" stopColor="#8e5cff" />
          <stop offset="100%" stopColor="#0a84ff" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${gid})`} />
      {appLogo === 'classic' && (
        <>
          <path d="M256 96 C 300 148 300 196 256 244 C 212 196 212 148 256 96 Z" fill="none" stroke="#D9A94C" strokeWidth="18" />
          <circle cx="256" cy="172" r="26" fill="#F3C566" />
        </>
      )}
      <text x="256" y="430" textAnchor="middle" fontFamily="'Noto Serif Bengali', serif" fontSize="190" fontWeight="700" fill="#EFD9A7">পূ</text>
    </svg>
  )
}

/* Maya's brand mark — a lotus "guide-light" emblem on a deep indigo orb with a
   spark. Self-contained (its own gradient orb) so it works at any size, from
   the FAB to inline chat avatars. */
export function MayaMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  const uid = useId().replace(/[:]/g, '')
  const orb = `mayaOrb-${uid}`
  const spark = `mayaSpark-${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} role="img" aria-label="Maya">
      <defs>
        <radialGradient id={orb} cx="34%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#9a6fd0" />
          <stop offset="48%" stopColor="#6a3d9a" />
          <stop offset="100%" stopColor="#3d1f63" />
        </radialGradient>
        <linearGradient id={spark} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e4ad" />
          <stop offset="100%" stopColor="#d9a94c" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill={`url(#${orb})`} />
      {/* lotus: centre petal (ivory) + two gold side petals */}
      <path d="M24 11 C 29.4 17.4 29.4 25 24 31.4 C 18.6 25 18.6 17.4 24 11 Z" fill="#faf3e6" />
      <path d="M24 31.4 C 18.6 26.4 12.4 25.4 9.2 28.6 C 12 33.8 18.6 34.8 24 34 Z" fill={`url(#${spark})`} />
      <path d="M24 31.4 C 29.4 26.4 35.6 25.4 38.8 28.6 C 36 33.8 29.4 34.8 24 34 Z" fill={`url(#${spark})`} />
      {/* inner seed / third-eye */}
      <circle cx="24" cy="21" r="3" fill="#4a2574" />
      <circle cx="24" cy="21" r="1.3" fill="#f3c566" />
      {/* spark — signals the AI assistant */}
      <path d="M37 9 l1.1 2.9 L41 13 l-2.9 1.1 L37 17 l-1.1-2.9 L33 13 l2.9-1.1 Z" fill="#f7e4ad" opacity="0.95" />
    </svg>
  )
}

/* Image surface: deterministic warm gradient (offline-safe); real photos can
   layer over it later via `src` without breaking layout. */
export function Img({
  palette, src, alt, className = '', children,
}: { palette: Palette; src?: string; alt: string; className?: string; children?: ReactNode }) {
  const image = src ?? palette.img
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
      role="img"
      aria-label={alt}
    >
      {image && <img src={image} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      {/* soft lamp glow only over flat gradients, keeps them from looking empty */}
      {!image && (
        <div className="pointer-events-none absolute -top-1/3 left-1/2 h-2/3 w-2/3 -translate-x-1/2 rounded-full bg-gold-bright/20 blur-2xl" />
      )}
      {children}
    </div>
  )
}

type BtnProps = HTMLMotionProps<'button'> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'dark' | 'maya' | 'gold'
  size?: 'sm' | 'md'
}
export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm' }
  const variants = {
    primary: 'grad-brand text-white hover:brightness-110 glow-vermilion',
    outline: 'border border-vermilion/40 text-vermilion hover:bg-vermilion-tint',
    ghost: 'text-ink-soft hover:bg-ivory-deep',
    dark: 'bg-night-soft text-on-image hover:bg-night',
    maya: 'bg-gradient-to-r from-maya-deep to-maya text-white hover:opacity-90',
    gold: 'bg-gold text-white hover:bg-gold-soft',
  }
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 15 }}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export function Chip({
  active = false, children, className = '', ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
        active
          ? 'border-transparent grad-brand text-white shadow-[0_4px_14px_rgb(139_92_246/0.42)]'
          : 'border-white/50 bg-card/60 text-ink-soft backdrop-blur-md hover:border-vermilion/40 hover:scale-[1.03] dark:border-white/15 dark:bg-white/10'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      {action && (
        <button onClick={onAction} className="flex items-center text-xs font-medium text-vermilion">
          {action} <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

/** Horizontal scroll rail — cards slide in on a spring stagger as they enter view. */
export function Rail({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  if (reduce) {
    return (
      <div className="no-scrollbar -mx-4 flex items-stretch gap-3 overflow-x-auto px-4 pb-1">
        {Children.map(children, (child, i) => (
          <div key={i} className="flex shrink-0">{child}</div>
        ))}
      </div>
    )
  }
  return (
    <div className="no-scrollbar -mx-4 flex items-stretch gap-3 overflow-x-auto px-4 pb-1">
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.07 }}
          className="flex shrink-0"
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Star size={13} className="fill-gold text-gold" />
      <b className="text-ink">{rating.toFixed(1)}</b>
      {count !== undefined && <span className="text-faint">({(count / 1000).toFixed(1)}k reviews)</span>}
    </span>
  )
}

export function CrowdTag({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const t = useT()
  const label = t(level === 'high' ? 'crowdHigh' : level === 'moderate' ? 'crowdModerate' : 'crowdLow')
  const styles = {
    high: 'text-vermilion',
    moderate: 'text-gold',
    low: 'text-emerald-700',
  }[level]
  const Icon = level === 'high' ? Users : level === 'moderate' ? Users : Users
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${styles}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

/* ─── App shell + bottom navigation ─── */
const NAV = [
  { to: '/', key: 'home', icon: Home },
  { to: '/favorites', key: 'favorites', icon: Heart },
  { to: '/search', key: 'search', icon: Search },
  { to: '/categories', key: 'categories', icon: LayoutGrid },
  { to: '/meets', key: 'meets', icon: Users },
] as const

export function BottomNav() {
  const t = useT()
  return (
    <nav
      aria-label="Primary"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      className="glass-strong fixed left-1/2 z-40 flex w-auto max-w-[94%] -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5"
    >
      {NAV.map(({ to, key, icon: Icon }) => (
        <NavLink key={to} to={to} aria-label={t(key)} className="flex">
          {({ isActive }) => (
            <div
              className={`flex items-center rounded-full px-3.5 py-2 transition-colors duration-200 ${
                isActive ? 'grad-brand-fluid text-white shadow-[0_4px_14px_rgb(139_92_246/0.45)]' : 'text-faint'
              }`}
            >
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              <NavLabel active={isActive} label={t(key)} />
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/* Active-tab label. Width is a pure function of `active` (always mounted → never
   an orphaned exit animation). We animate to a measured pixel width rather than
   'auto' because Framer can't measure 'auto' while the box is collapsed (0 +
   overflow-hidden), which previously left every non-initial tab stuck at 0. */
function NavLabel({ active, label }: { active: boolean; label: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setW(el.scrollWidth)
    measure()
    // Re-measure once web fonts settle — Bengali/Devanagari glyphs differ in width.
    const fonts = (document as { fonts?: FontFaceSet }).fonts
    if (fonts?.ready) void fonts.ready.then(measure)
  }, [label])
  return (
    <motion.span
      ref={ref}
      initial={false}
      animate={{ width: active ? w : 0, opacity: active ? 1 : 0 }}
      transition={{ duration: 0.26, ease: EASE }}
      className="overflow-hidden whitespace-nowrap text-[12px] font-semibold leading-none"
    >
      <span className="block pl-1.5">{label}</span>
    </motion.span>
  )
}

/** Persistent Maya access — the doc's "prominent obvious action". */
export function MayaFab() {
  const loc = useLocation()
  if (loc.pathname.startsWith('/maya') || loc.pathname === '/safety') return null
  return (
    <NavLink
      to="/maya"
      aria-label="Ask Maya"
      className="fixed bottom-[78px] right-4 z-40 mx-auto flex h-12 w-12 items-center justify-center overflow-visible rounded-full shadow-lift"
      style={{ right: 'max(1rem, calc(50% - 28rem))' }}
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-maya/50"
        animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        aria-hidden
      />
      <motion.span
        className="relative grid place-items-center rounded-full"
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <MayaMark size={46} />
      </motion.span>
    </NavLink>
  )
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  const rm = useReducedMotion()
  const reduce = useApp((s) => s.reduceMotion)
  return (
    <motion.main
      initial={rm || reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 230, damping: 26, mass: 0.7 }}
      style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      className={`mx-auto min-h-dvh max-w-lg px-4 pb-24 ${className}`}
    >
      {children}
    </motion.main>
  )
}

/** Card with the mockups' subtle press-scale. */
export function Card({ children, className = '', ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      className={`glass overflow-hidden rounded-card ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function BackHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="mb-3 flex items-center justify-between">
      <button aria-label="Go back" onClick={() => history.back()} className="text-ink-soft">
        <ChevronRight size={20} className="rotate-180" />
      </button>
      <h1 className="text-center text-base font-semibold">{title}</h1>
      <div className="min-w-6 flex justify-end">{right}</div>
    </header>
  )
}

/** Light/dark switch — flips the theme in the store (App mirrors it to the html class). */
export function ThemeToggle() {
  const theme = useApp((s) => s.theme)
  const setTheme = useApp((s) => s.setTheme)
  // Derive from `theme` (the source of truth), never the DOM — reading the html
  // class here would be one render stale because App toggles it in a useEffect.
  const systemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && systemDark)
  return (
    <motion.button
      whileTap={{ scale: 0.82, rotate: 90 }}
      transition={{ type: 'spring', stiffness: 380, damping: 16 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative grid h-8 w-8 place-items-center rounded-full text-vermilion"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={String(isDark)}
          initial={{ opacity: 0, y: -6, rotate: -30 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: 6, rotate: 30 }}
          transition={{ duration: 0.18 }}
        >
          {isDark ? <Moon size={19} /> : <Sun size={19} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

/** App-wide animated ambient gradient — the premium "living wallpaper" backdrop. */
export function AmbientBackground() {
  return (
    <div aria-hidden className="ambient">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
    </div>
  )
}

export { Bookmark, MapPin }