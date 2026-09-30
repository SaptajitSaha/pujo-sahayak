// ─── Pujo Sahayak data model ────────────────────────────────────────────────
// Place is the generalisation (doc §39): Pandal / Restaurant / Event are subtypes.
// Everything here is demo content — `isDemo` marks it as such (doc §58: honesty).

export type CrowdLevel = 'low' | 'moderate' | 'high'
export type PlaceType = 'pandal' | 'restaurant'
export type Lang = 'en' | 'bn' | 'hi'
export type Theme = 'light' | 'dark' | 'system'
export type PlanDay = 'panchami' | 'shashthi' | 'saptami' | 'ashtami' | 'navami' | 'dashami'

export interface Palette {
  /** Deterministic warm gradient used when no photography is available. */
  from: string
  to: string
  /** Optional real photo (path or URL). Renders over the gradient when present. */
  img?: string
}

export interface Review {
  id: string
  author: string
  rating: number
  text: string
  date: string
}

export interface Photo {
  id: string
  title: string
  author: string
  palette: Palette
  likes: number
}

export interface Dish {
  id: string
  name: string
  nameBn?: string
  palette: Palette
}

export interface Place {
  id: string
  type: PlaceType
  name: string
  nameBn?: string
  subtitle?: string // club / descriptor
  area: string
  lat: number
  lng: number
  rating: number
  reviewCount: number
  distanceKm: number
  crowd?: CrowdLevel
  theme?: string // pandal theme
  story?: string
  storyBn?: string
  artist?: string
  openTill?: string
  metro?: string
  facilities: string[]
  palette: Palette
  pastEditions?: { year: number; theme: string; palette: Palette }[]
  reviews?: Review[]
  topClicks?: Photo[]
  cuisine?: string
  priceBand?: '₹' | '₹₹' | '₹₹₹' | '₹₹₹'
  openNow?: boolean
  hours?: string
  popularDishes?: Dish[]
}

export interface EventItem {
  id: string
  name: string
  date: string
  time: string
  venue: string
  category: string
  palette: Palette
}

export interface Meetup {
  id: string
  title: string
  date: string
  time: string
  location: string
  lat: number
  lng: number
  description: string
  interests: string[]
  attendees: number
  maxParticipants: number
  visibility: 'public' | 'restricted'
  palette: Palette
  host: string
}

export interface Offer {
  id: string
  brand: string
  title: string
  description: string
  code?: string
  palette: Palette
}

/**
 * A best-selling product from a Kolkata-area mall's Durga Puja sale.
 * In production this list is aggregated from mall feeds (online + in-store).
 * Today it's demo content — same honesty convention as the rest of `demo.ts`
 * (see IS_DEMO). Prices are in INR; `originalPrice` is the MRP shown struck
 * through, `discountPct` is the pre-computed savings badge.
 */
export interface ShoppingProduct {
  id: string
  name: string
  nameBn?: string
  /** Display-formatted mall/retail destination (e.g. "Quest Mall", "Mani Square"). */
  mall: string
  /** Neighborhood/area the mall is in — helps users orient (e.g. "Ballygunge"). */
  area: string
  category: 'Saree' | 'Kurta' | 'Jewellery' | 'Footwear' | 'Kids' | 'Home Decor' | 'Puja Essentials' | 'Bags'
  /** Current sale price in INR. */
  price: number
  /** MRP in INR — rendered struck-through. */
  originalPrice: number
  /** 1-99 — rendered as a "-X%" badge. */
  discountPct: number
  /** Editorial tag: "Bestseller", "Handloom", "Trending", etc. Optional. */
  tag?: string
  palette: Palette
}

export interface SafetyPoint {
  id: string
  kind: 'police' | 'medical' | 'helpdesk' | 'lostfound' | 'fire'
  name: string
  detail: string
  distanceM: number
  lat: number
  lng: number
}

export interface SponsoredItem {
  id: string
  brand: string
  title: string
  description: string
  palette: Palette
}

export interface CategoryDef {
  id: string
  label: string
  labelBn: string
  icon: string // icon key resolved by the UI
  group: 'places' | 'transport' | 'utilities'
  route: string
}

/** A stop inside a Puja Planner day. */
export interface PlanStop {
  placeId: string
  time: string // 24h "18:00"
  durationMin: number
}

export interface MissingPersonReport {
  id: string
  personType: 'child' | 'adult' | 'elderly'
  name: string
  details: string
  lastSeenPlaceId?: string
  photoDataUrl?: string
  createdAt: string
}

/** A user-saved address in the location picker (doc §onboarding: quick-commerce style). */
export type AddressType = 'home' | 'work' | 'other'
export interface SavedAddress {
  id: string
  label: string
  type: AddressType
  address: string
}

/** In-app notification (offers, reminders, meetups, safety). Demo content, marked unread/read. */
export type NotifKind = 'offer' | 'reminder' | 'meetup' | 'safety' | 'update'
export interface AppNotification {
  id: string
  kind: NotifKind
  title: string
  body: string
  time: string
  read: boolean
  /** Optional deep link — the specific screen/item this notification points to. */
  href?: string
}
