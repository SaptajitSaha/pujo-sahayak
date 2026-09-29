import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AmbientBackground, BottomNav, MayaFab, useScrollIdlePause } from './components/ui'
import { Intro } from './components/Intro'
import { useApp } from './store'
import { describeCurrentLocation } from './lib/geo'
// Home is eager for an instant first paint; every other route is code-split and
// loaded on demand. This also keeps heavy per-page deps (e.g. Leaflet in TripMap)
// out of the main chunk.
import Home from './pages/Home'
const Explore = lazy(() => import('./pages/Explore'))
const PandalDetail = lazy(() => import('./pages/PandalDetail'))
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'))
const Maya = lazy(() => import('./pages/Maya'))
const MayaScan = lazy(() => import('./pages/MayaScan'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const Categories = lazy(() => import('./pages/Categories'))
const Meets = lazy(() => import('./pages/Meets'))
const CreateMeetup = lazy(() => import('./pages/CreateMeetup'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Planner = lazy(() => import('./pages/Planner'))
const TripMap = lazy(() => import('./pages/TripMap'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Safety = lazy(() => import('./pages/Safety'))
const MissingPerson = lazy(() => import('./pages/MissingPerson'))
const BeyondPuja = lazy(() => import('./pages/BeyondPuja'))
const LocationPicker = lazy(() => import('./pages/LocationPicker'))
const Notifications = lazy(() => import('./pages/Notifications'))

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-vermilion/30 border-t-vermilion" />
    </div>
  )
}

function useApplyTheme() {
  const theme = useApp((s) => s.theme)
  const reduceMotion = useApp((s) => s.reduceMotion)
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', dark)
      root.classList.toggle('reduce-motion', reduceMotion)
    }
    apply()
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme, reduceMotion])
}

/** Detect the device location once, on first open, and adopt it as the current area. */
function useAutoDetectLocation() {
  const geoTried = useApp((s) => s.geoTried)
  useEffect(() => {
    if (geoTried) return
    useApp.getState().markGeoTried()
    describeCurrentLocation()
      .then((label) => useApp.getState().setCurrentAddress(label))
      .catch(() => {
        /* permission denied or offline — stay on the demo area, invent nothing */
      })
  }, [geoTried])
}

export default function App() {
  useApplyTheme()
  useAutoDetectLocation()
  useScrollIdlePause()

  // First-open brand intro shown as an overlay over Home, masking cold-start
  // paint + font load. Dismisses once fonts are ready, but never before a short
  // minimum beat (so it doesn't flash); tap-to-skip any time.
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    if (!intro) return
    let alive = true
    const fast = useApp.getState().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches
    const minMs = fast ? 350 : 1750
    const start = performance.now()
    const fonts = document.fonts?.ready ?? Promise.resolve()
    Promise.race([fonts, new Promise((r) => setTimeout(r, 2600))])
      .then(() => new Promise((r) => setTimeout(r, Math.max(0, minMs - (performance.now() - start)))))
      .then(() => { if (alive) setIntro(false) })
    return () => { alive = false }
  }, [intro])

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<RouteFallback />}>
        <Shell />
      </Suspense>
      <AnimatePresence>
        {intro && <Intro key="intro" onSkip={() => setIntro(false)} />}
      </AnimatePresence>
    </MotionConfig>
  )
}

function Shell() {
  return (
    <>
      <AmbientBackground />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/pandal/:id" element={<PandalDetail />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/maya" element={<Maya />} />
        <Route path="/maya/scan" element={<MayaScan />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/meets" element={<Meets />} />
        <Route path="/meets/create" element={<CreateMeetup />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/trip/:day" element={<TripMap />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/settings" element={<Settings />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/safety/missing-person" element={<MissingPerson />} />
        <Route path="/beyond-puja" element={<BeyondPuja />} />
        <Route path="/location" element={<LocationPicker />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MayaFab />
      <BottomNav />
    </>
  )
}
