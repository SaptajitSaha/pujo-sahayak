import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppNotification, City, Lang, MissingPersonReport, PlanDay, PlanStop, SavedAddress, Theme, TrustedContact, UserReview,
} from './data/types'
import { placeById } from './data/demo'
import { haversineKm } from './lib/geo'
import type { Checkin } from './lib/scorecard'

export const PLAN_DAYS: PlanDay[] = ['panchami', 'shashthi', 'saptami', 'ashtami', 'navami', 'dashami']

interface Session {
  kind: 'category' | 'place' | 'search'
  label: string
  sublabel?: string
  href: string
  at: number
}

interface AppState {
  saved: string[]
  visited: string[]
  planner: Record<PlanDay, PlanStop[]>
  joinedMeetups: string[]
  missingReports: MissingPersonReport[]
  lang: Lang
  theme: Theme
  reduceMotion: boolean
  appLogo: 'classic' | 'no-eye'
  premium: boolean
  session: Session | null

  // Location + saved addresses (quick-commerce style address switcher)
  currentAddress: string
  geoTried: boolean
  savedAddresses: SavedAddress[]

  // Notifications
  notifications: AppNotification[]

  // Phase 1 new slices
  reviews: UserReview[]
  trustedContacts: TrustedContact[]
  selectedCity: City
  sosActive: boolean
  /** GPS-verified pandal check-ins powering the Scorecard. Pure local log —
      a check-in is only appended after withinGeofence confirms on-site presence
      (see PandalDetail). Nothing is invented; the badges/counts are derived from
      this array alone. */
  checkins: Checkin[]
  /** Year-round demo mode for the Home "Today: <tithi>" chip. When on,
      the chip renders as if today were Ashtami so reviewers and diaspora
      users outside the 2026 puja window still see the flow. Default off —
      honesty convention (doc §58). */
  tithiDemoMode: boolean

  toggleSaved: (id: string) => void
  toggleVisited: (id: string) => void
  addStop: (day: PlanDay, stop: PlanStop) => void
  removeStop: (day: PlanDay, placeId: string) => void
  reorderStops: (day: PlanDay, stops: PlanStop[]) => void
  optimizeDay: (day: PlanDay) => void
  toggleMeetup: (id: string) => void
  reportMissing: (r: MissingPersonReport) => void
  setLang: (l: Lang) => void
  setTheme: (t: Theme) => void
  setReduceMotion: (v: boolean) => void
  setAppLogo: (v: 'classic' | 'no-eye') => void
  setPremium: (v: boolean) => void
  track: (s: Session) => void
  setCurrentAddress: (a: string) => void
  markGeoTried: () => void
  addAddress: (a: Omit<SavedAddress, 'id'>) => void
  removeAddress: (id: string) => void
  markAllNotifsRead: () => void
  markNotifRead: (id: string) => void
  addReview: (r: Omit<UserReview, 'id' | 'createdAt'>) => void
  removeReview: (id: string) => void
  addCheckin: (c: Checkin) => void
  setTrustedContacts: (c: TrustedContact[]) => void
  setSelectedCity: (c: City) => void
  setSosActive: (v: boolean) => void
  setTithiDemoMode: (v: boolean) => void
}

const emptyPlanner: Record<PlanDay, PlanStop[]> = {
  panchami: [], shashthi: [], saptami: [], ashtami: [], navami: [], dashami: [],
}

// Demo seed — surfaced only on a fresh install (persist keeps the user's own edits).
const SEED_ADDRESSES: SavedAddress[] = [
  { id: 'addr-home', label: 'Home', type: 'home', address: 'Ballygunge, Kolkata' },
  { id: 'addr-work', label: 'Office', type: 'work', address: 'Sector V, Salt Lake, Kolkata' },
  { id: 'addr-other', label: 'Pitashmoon', type: 'other', address: 'North Kolkata, Paikpara' },
]

const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', kind: 'offer', title: 'Axis Bank Puja offer ends tonight', body: 'Extra 15% off on shopping + food orders before 11:59 PM.', time: '2h ago', read: false, href: '/beyond-puja' },
  { id: 'n2', kind: 'reminder', title: 'Your Ashtami plan is ready', body: '3 pandals queued — Mudumbi, Deshapriya and Santoshpur are on the route.', time: '5h ago', read: false, href: '/planner' },
  { id: 'n3', kind: 'meetup', title: 'Priya invited you to a Photography Walk', body: 'Southeastern Bengal Club • Saturday 6:30 PM • 5 going.', time: '1d ago', read: false, href: '/meets' },
  { id: 'n4', kind: 'safety', title: 'Crowd advisory: Bagbazar after 8 PM', body: 'Very high crowds expected — consider visiting earlier.', time: '1d ago', read: true, href: '/pandal/pandal-baghbazar' },
  { id: 'n5', kind: 'update', title: 'Maya can now answer crowd questions', body: 'Ask “what’s the crowd right now?” on any pandal page.', time: '2d ago', read: true, href: '/maya' },
]

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      saved: [],
      visited: [],
      planner: emptyPlanner,
      joinedMeetups: [],
      missingReports: [],
      lang: 'en',
      theme: 'system',
      reduceMotion: false,
      appLogo: 'classic',
      premium: false,
      session: null,

      currentAddress: 'Ballygunge, Kolkata',
      geoTried: false,
      savedAddresses: SEED_ADDRESSES,
      notifications: SEED_NOTIFICATIONS,
      reviews: [],
      trustedContacts: [],
      selectedCity: 'kolkata',
      sosActive: false,
      tithiDemoMode: false,
      checkins: [],

      toggleSaved: (id) =>
        set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      toggleVisited: (id) =>
        set((s) => ({ visited: s.visited.includes(id) ? s.visited.filter((x) => x !== id) : [...s.visited, id] })),
      addStop: (day, stop) =>
        set((s) => ({ planner: { ...s.planner, [day]: [...s.planner[day], stop] } })),
      removeStop: (day, placeId) =>
        set((s) => ({ planner: { ...s.planner, [day]: s.planner[day].filter((x) => x.placeId !== placeId) } })),
      reorderStops: (day, stops) => set((s) => ({ planner: { ...s.planner, [day]: stops } })),
      /** Nearest-neighbour reordering from the first stop — a suggestion, not an "optimal" claim. */
      optimizeDay: (day) => {
        const stops = [...get().planner[day]]
        if (stops.length < 3) return
        const order: PlanStop[] = []
        let cur = stops.shift()!
        order.push(cur)
        while (stops.length) {
          const a = placeById(cur.placeId)
          let best = 0
          let bestD = Infinity
          stops.forEach((s, i) => {
            const b = placeById(s.placeId)
            if (!a || !b) return
            const d = haversineKm(a.lat, a.lng, b.lat, b.lng)
            if (d < bestD) (bestD = d), (best = i)
          })
          cur = stops.splice(best, 1)[0]
          order.push(cur)
        }
        set((s) => ({ planner: { ...s.planner, [day]: order } }))
      },
      toggleMeetup: (id) =>
        set((s) => ({
          joinedMeetups: s.joinedMeetups.includes(id)
            ? s.joinedMeetups.filter((x) => x !== id)
            : [...s.joinedMeetups, id],
        })),
      reportMissing: (r) => set((s) => ({ missingReports: [r, ...s.missingReports] })),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setAppLogo: (appLogo) => set({ appLogo }),
      setPremium: (premium) => set({ premium }),
      track: (session) => set({ session }),
      setCurrentAddress: (currentAddress) => set({ currentAddress }),
      markGeoTried: () => set({ geoTried: true }),
      addAddress: (a) =>
        set((s) => ({ savedAddresses: [...s.savedAddresses, { ...a, id: 'addr-' + Date.now() }] })),
      removeAddress: (id) => set((s) => ({ savedAddresses: s.savedAddresses.filter((x) => x.id !== id) })),
      markAllNotifsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      markNotifRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      addReview: (r) => set((s) => ({ reviews: [{ ...r, id: 'rev-' + Date.now(), createdAt: new Date().toISOString() }, ...s.reviews] })),
      removeReview: (id) => set((s) => ({ reviews: s.reviews.filter((x) => x.id !== id) })),
      /** Append a check-in, but never a second one for the same pandal on the
          same tithi — re-tapping the button is idempotent. */
      addCheckin: (c) =>
        set((s) => (
          s.checkins.some((x) => x.placeId === c.placeId && x.tithi === c.tithi)
            ? s
            : { checkins: [...s.checkins, c] }
        )),
      setTrustedContacts: (trustedContacts) => set({ trustedContacts }),
      setSelectedCity: (selectedCity) => set({ selectedCity }),
      setSosActive: (sosActive) => set({ sosActive }),
      setTithiDemoMode: (tithiDemoMode) => set({ tithiDemoMode }),
    }),
    {
      name: 'pujo-sahayak',
      version: 3,
      // v2 added reviews, trustedContacts, selectedCity, sosActive. Existing
      // installs persisted without these; provide safe defaults.
      // v3 adds the checkins log (Scorecard) — additive, defaults to empty.
      migrate: (persisted, oldVersion) => {
        const p = persisted as Partial<AppState> | undefined
        if (!p) return {} as unknown as AppState
        if (oldVersion < 1 && Array.isArray(p.notifications)) {
          p.notifications = p.notifications.map((n) => {
            const seed = SEED_NOTIFICATIONS.find((s) => s.id === n.id)
            return seed ? { ...n, href: seed.href } : n
          })
        }
        if (!p.reviews) p.reviews = []
        if (!p.trustedContacts) p.trustedContacts = []
        if (!p.selectedCity) p.selectedCity = 'kolkata'
        if (p.sosActive === undefined) p.sosActive = false
        if (p.tithiDemoMode === undefined) p.tithiDemoMode = false
        if (!Array.isArray(p.checkins)) p.checkins = []
        return p as AppState
      },
    },
  ),
)
