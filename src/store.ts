import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppNotification, Lang, MissingPersonReport, PlanDay, PlanStop, SavedAddress, Theme,
} from './data/types'
import { placeById } from './data/demo'

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
    }),
    {
      name: 'pujo-sahayak',
      version: 1,
      // v1 introduced notification deep-links. Existing installs already persisted a
      // notifications array without `href`, and that stored array would otherwise win
      // over the seed. Re-attach href by id while preserving each item's read state.
      migrate: (persisted) => {
        const p = persisted as Partial<AppState> | undefined
        if (p && Array.isArray(p.notifications)) {
          p.notifications = p.notifications.map((n) => {
            const seed = SEED_NOTIFICATIONS.find((s) => s.id === n.id)
            return seed ? { ...n, href: seed.href } : n
          })
        }
        return p as AppState
      },
    },
  ),
)

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
