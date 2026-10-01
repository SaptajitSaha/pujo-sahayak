import { lazy, Suspense, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CloudOff } from 'lucide-react'
import { AmbientBackground, BottomNav, MayaFab, useScrollIdlePause } from './components/ui'
import { useApp } from './store'
import { describeCurrentLocation } from './lib/geo'
// Home is eager for an instant first paint; every other route is code-split so
// its per-page deps (e.g. Leaflet in TripMap) stay out of the main chunk. The
// loaders are kept as a named map so `preloadRoutes()` below can warm every
// chunk in parallel right after boot — by the time the user taps a nav item,
// the module is already in Vite's cache and React.lazy resolves synchronously.
import Home from './pages/Home'

const loaders = {
  Explore: () => import('./pages/Explore'),
  PandalDetail: () => import('./pages/PandalDetail'),
  RestaurantDetail: () => import('./pages/RestaurantDetail'),
  Maya: () => import('./pages/Maya'),
  MayaScan: () => import('./pages/MayaScan'),
  SearchPage: () => import('./pages/SearchPage'),
  Categories: () => import('./pages/Categories'),
  Meets: () => import('./pages/Meets'),
  CreateMeetup: () => import('./pages/CreateMeetup'),
  Favorites: () => import('./pages/Favorites'),
  Planner: () => import('./pages/Planner'),
  TripMap: () => import('./pages/TripMap'),
  Profile: () => import('./pages/Profile'),
  Settings: () => import('./pages/Settings'),
  Safety: () => import('./pages/Safety'),
  MissingPerson: () => import('./pages/MissingPerson'),
  BeyondPuja: () => import('./pages/BeyondPuja'),
  LocationPicker: () => import('./pages/LocationPicker'),
  Notifications: () => import('./pages/Notifications'),
  Walks: () => import('./pages/Walks'),
  ArtistDetail: () => import('./pages/ArtistDetail'),
  Tithi: () => import('./pages/Tithi'),
  Phrasebook: () => import('./pages/Phrasebook'),
  ShareTarget: () => import('./pages/ShareTarget'),
  Auth: () => import('./pages/Auth'),
  SocialMatch: () => import('./pages/SocialMatch'),
  Marketplace: () => import('./pages/Marketplace'),
  MetroGuide: () => import('./pages/MetroGuide'),
  ServiceDirectory: () => import('./pages/ServiceDirectory'),
  Passport: () => import('./pages/Passport'),
  Diary: () => import('./pages/Diary'),
}

const Explore = lazy(loaders.Explore)
const PandalDetail = lazy(loaders.PandalDetail)
const RestaurantDetail = lazy(loaders.RestaurantDetail)
const Maya = lazy(loaders.Maya)
const MayaScan = lazy(loaders.MayaScan)
const SearchPage = lazy(loaders.SearchPage)
const Categories = lazy(loaders.Categories)
const Meets = lazy(loaders.Meets)
const CreateMeetup = lazy(loaders.CreateMeetup)
const Favorites = lazy(loaders.Favorites)
const Planner = lazy(loaders.Planner)
const TripMap = lazy(loaders.TripMap)
const Profile = lazy(loaders.Profile)
const Settings = lazy(loaders.Settings)
const Safety = lazy(loaders.Safety)
const MissingPerson = lazy(loaders.MissingPerson)
const BeyondPuja = lazy(loaders.BeyondPuja)
const LocationPicker = lazy(loaders.LocationPicker)
const Notifications = lazy(loaders.Notifications)
const Walks = lazy(loaders.Walks)
const ArtistDetail = lazy(loaders.ArtistDetail)
const Tithi = lazy(loaders.Tithi)
const Phrasebook = lazy(loaders.Phrasebook)
const ShareTarget = lazy(loaders.ShareTarget)
const Auth = lazy(loaders.Auth)
const SocialMatch = lazy(loaders.SocialMatch)
const Marketplace = lazy(loaders.Marketplace)
const MetroGuide = lazy(loaders.MetroGuide)
const ServiceDirectory = lazy(loaders.ServiceDirectory)
const Passport = lazy(loaders.Passport)
const Diary = lazy(loaders.Diary)

/** Warm every code-split page's JS chunk — but only AFTER the boot splash has
    handed off (main.tsx calls this from hideBoot), and one chunk per browser
    idle slice via requestIdleCallback. Firing all 30+ chunks in bursts DURING
    the intro pegged the main thread on parse/compile while the festive splash
    was still animating and Home was hydrating — the source of the stutter.
    Idle-slicing spreads the same total work across frames the browser would
    otherwise leave idle (the `timeout` guarantees a slot even under load), so
    it never blocks the current frame; the priority order caches the routes a
    user taps soonest first. Errors are swallowed: a failed preload is retried
    by the real navigation, which the Suspense fallback covers. */
export function preloadRoutes() {
  const priority = ['Explore', 'PandalDetail', 'SearchPage', 'Categories', 'Favorites', 'Planner', 'Profile', 'Maya', 'TripMap', 'Meets', 'Notifications', 'Safety']
  const names = Object.keys(loaders).sort((a, b) => {
    const pa = priority.indexOf(a); const pb = priority.indexOf(b)
    return (pa < 0 ? 999 : pa) - (pb < 0 ? 999 : pb)
  })
  const idle: (cb: () => void) => void =
    typeof (window as unknown as { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => void }).requestIdleCallback === 'function'
      ? (cb) => (window as unknown as { requestIdleCallback: (c: () => void, o?: { timeout: number }) => void }).requestIdleCallback(cb, { timeout: 1500 })
      : (cb) => window.setTimeout(cb, 120)
  let i = 0
  const step = () => {
    if (i >= names.length) return
    try {
      loaders[names[i++] as keyof typeof loaders]().catch(() => {})
    } catch {
      /* a loader throwing synchronously is non-fatal; navigation retries */
    }
    idle(step)
  }
  idle(step)
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-vermilion/30 border-t-vermilion" />
    </div>
  )
}

/** Top-of-screen indicator when the device loses connectivity, so the Supabase-
    backed sections (live notes, notices, orders) don't look broken — content is
    served from cache and any queued writes sync on reconnect. */
function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-1.5 bg-night/90 px-4 py-1.5 text-center text-[11px] font-medium text-on-image"
      style={{ paddingTop: 'calc(0.375rem + env(safe-area-inset-top))' }}
    >
      <CloudOff size={13} /> Offline — showing saved data; changes will sync when you reconnect.
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

  // The festive first-open intro is a pure-CSS boot splash declared inline in
  // index.html so it paints on the very first frame (before this bundle even
  // executes). main.tsx fades it out once the app has mounted + fonts settled,
  // and kicks off `preloadRoutes()` alongside it so every page chunk is already
  // in cache by the time the user taps a nav item.
  //
  // AmbientBackground, MayaFab and BottomNav sit OUTSIDE the Suspense boundary
  // on purpose: during navigation only the routed content should swap. If they
  // lived inside, Suspense would unmount them too and the whole screen would
  // flash to the raw body background — the "black loading screen" bug.
  return (
    <MotionConfig reducedMotion="user">
      <AmbientBackground />
      <OfflineBanner />
      <Suspense fallback={<RouteFallback />}>
        <Shell />
      </Suspense>
      <MayaFab />
      <BottomNav />
    </MotionConfig>
  )
}

function Shell() {
  return (
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
      <Route path="/passport" element={<Passport />} />
      <Route path="/diary" element={<Diary />} />
      <Route path="/safety" element={<Safety />} />
      <Route path="/safety/missing-person" element={<MissingPerson />} />
      <Route path="/beyond-puja" element={<BeyondPuja />} />
      <Route path="/location" element={<LocationPicker />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/walks" element={<Walks />} />
      <Route path="/artist/:id" element={<ArtistDetail />} />
      <Route path="/tithi" element={<Tithi />} />
      <Route path="/phrasebook" element={<Phrasebook />} />
      <Route path="/share-target" element={<ShareTarget />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/social" element={<SocialMatch />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/transport/metro" element={<MetroGuide />} />
      <Route path="/services/:cat" element={<ServiceDirectory />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
