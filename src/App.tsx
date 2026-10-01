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

/** Fire every route's chunk download + parse in staggered waves. Called from
    main.tsx right after the app mounts so it runs during the inline CSS boot
    splash and font decode — invisible to the user. Splitting into three waves
    with `setTimeout(fn, 0)` between them lets the browser's network layer
    settle between batches, so a mid-range Android WebView's local asset fetcher
    doesn't saturate on 19 concurrent imports (which previously delayed the
    Home page's own hydration). Errors are swallowed: if a chunk fails to
    preload (offline / flaky), the next real navigation re-attempts it and the
    Suspense fallback covers that one transition. */
export function preloadRoutes() {
  const names = Object.keys(loaders)
  const wave = (list: string[]) => {
    for (const name of list) {
      try {
        loaders[name as keyof typeof loaders]().catch(() => {})
      } catch {
        /* a loader throwing synchronously is non-fatal; navigation retries */
      }
    }
  }
  // Chunk size matters: the heaviest pages (PandalDetail 18 KB, LocationPicker
  // 11 KB, Maya 7 KB, brain 19 KB for Maya's intent model) are split across
  // waves so no single burst exceeds ~40 KB of simultaneous decompression.
  const wave1 = names.filter((n) => ['Explore', 'SearchPage', 'Categories', 'Planner', 'TripMap', 'Favorites', 'Notifications'].includes(n))
  const wave2 = names.filter((n) => ['PandalDetail', 'RestaurantDetail', 'Maya', 'Meets', 'CreateMeetup', 'Profile', 'Settings'].includes(n))
  const wave3 = names.filter((n) => !wave1.includes(n) && !wave2.includes(n))
  wave(wave1)
  setTimeout(() => wave(wave2), 0)
  setTimeout(() => wave(wave3), 0)
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
