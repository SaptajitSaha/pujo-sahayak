// ─── Pujo Sahayak data model ────────────────────────────────────────────────
// Place is the generalisation (doc §39): Pandal / Restaurant / Event are subtypes.
// Everything here is demo content — `isDemo` marks it as such (doc §58: honesty).

export type CrowdLevel = 'low' | 'moderate' | 'high'
export type PlaceType = 'pandal' | 'restaurant'
export type Lang = 'en' | 'bn' | 'hi'
export type Theme = 'light' | 'dark' | 'system'
export type PlanDay = 'panchami' | 'shashthi' | 'saptami' | 'ashtami' | 'navami' | 'dashami'
export type City = 'kolkata' | 'siliguri' | 'howrah' | 'new-delhi'

export interface CityDef {
  id: City
  label: string
  labelBn: string
  lat: number
  lng: number
}

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
  cityId?: City
}

export interface EventItem {
  id: string
  name: string
  date: string
  time: string
  venue: string
  category: string
  palette: Palette
  cityId?: City
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
  cityId?: City
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

// ─── Phase 1 new entities ────────────────────────────────────────────────────

/** A pandal artist / idol-maker. Grounded in real Kumortuli / puja artists. */
export interface Artist {
  id: string
  name: string
  nameBn?: string
  specialty: string
  bio: string
  bioBn?: string
  palette: Palette
  pandalIds: string[]
}

/** A stop within a curated walk. */
export interface WalkStop {
  placeId: string
  highlight: string
  durationMin: number
}

/** A curated themed walking route (Photographer, Foodie, Family, etc.). */
export interface Walk {
  id: string
  title: string
  titleBn?: string
  description: string
  descBn?: string
  theme: 'photography' | 'food' | 'family' | 'heritage'
  stops: WalkStop[]
  totalDurationMin: number
  palette: Palette
  cityId?: City
}

/** Parking ground near a pandal cluster. */
export interface ParkingSpot {
  id: string
  name: string
  area: string
  lat: number
  lng: number
  capacityHint: 'small' | 'medium' | 'large'
  walkTimeMin: number
  ratePerHour: number
  nearestPandalIds: string[]
}

/** Blood bank near a hospital (demo seed — real names, sample availability). */
export interface BloodBank {
  id: string
  name: string
  hospital: string
  area: string
  lat: number
  lng: number
  phone: string
  availableGroups: string[]
  hours: string
}

/** Static metro timetable entry (sample — labeled "verify on-site"). */
export interface MetroETA {
  id: string
  station: string
  line: string
  firstTrain: string
  lastTrain: string
  frequencyMin: number
  nearestPandalIds: string[]
}

/** A day in the puja tithi calendar (Mahalaya → Bijoya). */
export interface Tithi {
  id: string
  day: number
  name: string
  nameBn: string
  date: string
  ritual: string
  ritualBn: string
  window: string
  whatToDo: string
  whatToDoBn: string
  planDay?: PlanDay
}

/** Bengali phrasebook entry. */
export interface Phrase {
  id: string
  category: 'greetings' | 'pandal' | 'food' | 'help' | 'transit'
  english: string
  bangla: string
  transliteration: string
}

/** User-submitted review persisted on-device via Zustand. */
export interface UserReview {
  id: string
  placeId: string
  rating: number
  text: string
  createdAt: string
}

/** Trusted contact for emergency SOS. */
export interface TrustedContact {
  id: string
  name: string
  phone: string
}

// ─── Five-feature extension types ────────────────────────────────────────────

/** Community live note — visitor-generated, time-limited observation. */
export interface LiveNote {
  id: string
  place_id: string
  author_id: string | null
  text: string
  created_at: string
  expires_at: string
  moderation_status: 'pending' | 'approved' | 'rejected' | 'expired'
  helpful_count: number
  reported_count: number
}

/** Official notice from a pandal authority or verified source. */
export interface OfficialNotice {
  id: string
  place_id: string
  source: string
  text: string
  created_at: string
  updated_at: string
  expires_at: string | null
  verification_status: 'unverified' | 'verified' | 'official'
}

/** Authority alert from a registered provider (police, traffic, medical). */
export interface AuthorityAlert {
  id: string
  provider_id: string | null
  place_id: string | null
  alert_type: 'emergency' | 'traffic' | 'closure' | 'safety' | 'medical' | 'operational'
  text: string
  created_at: string
  expires_at: string | null
}

/** Authority provider configuration. */
export interface AuthorityProvider {
  id: string
  name: string
  provider_type: 'police' | 'traffic' | 'medical' | 'pandal_ops' | 'government'
  api_url: string | null
  is_active: boolean
  created_at: string
}

/** Social matching preference profile. */
export interface SocialPreference {
  user_id: string
  interests: string[]
  preferred_areas: string[]
  preferred_time: string
  crowd_preference: string
  language_preference: string
  outing_style: string
  planned_tithi: string | null
  visibility: 'public' | 'hidden'
  display_name: string | null
}

/** A match card shown to the user (never exposes exact location). */
export interface MatchCard {
  userId: string
  displayName: string
  interests: string[]
  plannedArea: string
  plannedTithi: string | null
  matchScore: number
}

/** Marketplace product. */
export interface MarketplaceProduct {
  id: string
  seller_id: string | null
  name: string
  category: 'clothing' | 'accessories' | 'puja_essentials' | 'handmade' | 'experiences' | 'partner_offers'
  price: number
  description: string | null
  images: string[]
  availability: 'in_stock' | 'out_of_stock' | 'limited'
  area: string | null
  partner_status: 'independent' | 'partner' | 'verified'
  is_demo: boolean
  created_at: string
}

/** Marketplace order. */
export interface MarketplaceOrder {
  id: string
  product_id: string | null
  buyer_id: string | null
  status: 'initiated' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  amount: number
  created_at: string
  updated_at: string
}

/** Payment transaction record. */
export interface Transaction {
  id: string
  user_id: string | null
  order_id: string | null
  type: 'purchase' | 'refund' | 'subscription' | 'donation'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'demo_completed'
  provider_txn_id: string | null
  is_demo: boolean
  created_at: string
}

/** Stored payment method (tokenized only — never raw card data). */
export interface PaymentMethod {
  id: string
  user_id: string
  type: 'upi' | 'card' | 'netbanking' | 'wallet'
  last4: string | null
  is_default: boolean
  created_at: string
}

/** User-generated report for moderation. */
export interface UserReport {
  id: string
  reporter_id: string | null
  target_type: 'live_note' | 'product' | 'user' | 'order'
  target_id: string
  reason: string
  status: 'open' | 'reviewed' | 'actioned' | 'dismissed'
  created_at: string
}
