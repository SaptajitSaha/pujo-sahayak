// ─── App chrome — the persistent shell around every route ───────────────────
// The ambient wallpaper, the auto-hiding bottom navigation and the Maya FAB.
// These live outside the router's Suspense boundary (see App.tsx), so they are
// a separate concern from the design primitives in ui.tsx.

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Heart, Home, LayoutGrid, Search, Users } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useT } from '../i18n'
import { MayaMark } from './ui'

/* ─── App shell + bottom navigation ─── */
const NAV = [
  { to: '/', key: 'home', icon: Home },
  { to: '/favorites', key: 'favorites', icon: Heart },
  { to: '/search', key: 'search', icon: Search },
  { to: '/categories', key: 'categories', icon: LayoutGrid },
  { to: '/meets', key: 'meets', icon: Users },
] as const

/* Pause the always-on paint animations (fluid nav gradient, animated search
   border) for the duration of each scroll, resuming ~160ms after it stops. Those
   loops animate background-position / a conic @property angle on the MAIN thread,
   so every frame forces a repaint — the thing that pins Android WebView to 60 Hz.
   With them paused mid-scroll, the compositor only blits GPU layers (transform
   blobs + content) and can hold 90/120 Hz. Toggled as a class on <html>. */
export function useScrollIdlePause() {
  useEffect(() => {
    const root = document.documentElement
    let timer = 0
    const onScroll = () => {
      if (!root.classList.contains('is-scrolling')) root.classList.add('is-scrolling')
      window.clearTimeout(timer)
      timer = window.setTimeout(() => root.classList.remove('is-scrolling'), 160)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [])
}

/** Auto-hide-on-scroll hook used by the bottom nav.
    Returns `true` while the nav should be tucked off-screen.
    - Near the top (scrollY < 80) → always shown (users expect the bar on arrival).
    - Downward delta > ~6px → hide. Upward delta > ~6px → show. The deadzone
      filters sub-pixel jitter and momentum-end bounces so the nav doesn't
      flicker at the ends of a fling.
    - `enabled=false` freezes at `false` (shown) so the caller can pass
      `!isMayaRoute` and reuse the same component on the chat page.
    Hook stays mounted; internal state is mirrored in a ref so the scroll
    listener only calls `setState` when the boolean actually flips. */
function useScrollHideNav(enabled: boolean): boolean {
  const [hidden, setHidden] = useState(false)
  const hiddenRef = useRef(false)
  const lastYRef = useRef(0)
  const cooldownUntilRef = useRef(0)
  const loc = useLocation()

  useEffect(() => {
    if (!enabled) {
      if (hiddenRef.current) { hiddenRef.current = false; setHidden(false) }
      return
    }
    lastYRef.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - lastYRef.current
      lastYRef.current = y
      // Arrival cooldown: right after a route change, the browser dispatches a
      // scroll event when it restores history scroll position on the newly
      // mounted page. If we let that event flip `hidden`, the nav visibly
      // flashes in and then out on every back/forward. Ignore scroll bursts
      // for ~350ms after arrival; a real user gesture that soon is rare and
      // even then only delays the hide by a frame.
      if (performance.now() < cooldownUntilRef.current) return
      let next = hiddenRef.current
      if (y < 80) next = false
      else if (Math.abs(dy) > 6) next = dy > 0
      if (next !== hiddenRef.current) {
        hiddenRef.current = next
        setHidden(next)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled])

  // BottomNav never unmounts across routes (it lives at the App level, outside
  // the Suspense boundary), so state persists. On every pathname change: force
  // the nav visible, prime lastY to the current scroll, and start the arrival
  // cooldown above.
  useEffect(() => {
    if (hiddenRef.current) { hiddenRef.current = false; setHidden(false) }
    lastYRef.current = window.scrollY
    cooldownUntilRef.current = performance.now() + 350
  }, [loc.pathname])

  return hidden
}

export function BottomNav() {
  const t = useT()
  const loc = useLocation()
  // Full hide on the Maya thread so the fixed nav never collides with the
  // chat composer when the conversation grows past the fold. The scroll-hide
  // effect is disarmed here; state resets so the nav is shown on the next
  // non-Maya route.
  const onMaya = loc.pathname.startsWith('/maya')
  const hidden = useScrollHideNav(!onMaya)
  if (onMaya) return null
  return (
    <motion.nav
      initial={false}
      // Framer writes the whole `transform` inline, which overrides Tailwind's
      // `-translate-x-1/2` utility. So x stays here too, and the animation only
      // toggles y. 200% of the nav's own height comfortably clears the pill +
      // `0.75rem + env(safe-area-inset-bottom)` bottom inset on every device.
      animate={{ x: '-50%', y: hidden ? '200%' : '0%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.7 }}
      aria-label="Primary"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      className="glass-strong fixed left-1/2 z-40 flex w-auto max-w-[94%] items-center gap-1 rounded-full px-2 py-1.5"
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
    </motion.nav>
  )
}

/* Active-tab label. Expands via a `max-width` transition rather than the CSS
   grid 0fr→1fr trick or JS measurement: max-width interpolation is supported by
   every WebView engine (the device WebView left the grid approach collapsed, so
   no label ever showed), needs no scrollWidth/font-read timing, and clips
   cleanly. The element's own width is its intrinsic content width, capped at the
   (generous) active max-width — so the pill never over-widens and long i18n
   labels never clip. Width is a pure function of `active`, so labels always
   collapse when another tab is active. Reduced-motion is honoured by the global
   `transition-duration: 0.01ms !important` rule in index.css. */
function NavLabel({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      aria-hidden={!active}
      className="overflow-hidden whitespace-nowrap text-[12px] font-semibold leading-none"
      style={{
        maxWidth: active ? '9rem' : '0',
        opacity: active ? 1 : 0,
        transition: 'max-width 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
      }}
    >
      <span className="block pl-1.5">{label}</span>
    </span>
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

/** App-wide animated ambient gradient — the premium "living wallpaper" backdrop. */
export function AmbientBackground() {
  return (
    <div aria-hidden className="ambient">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
    </div>
  )
}
