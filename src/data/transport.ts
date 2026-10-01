// ─── Transport & services reference data ────────────────────────────────────
// Backs the dedicated pages opened from the Categories tiles: a rich Metro
// guide (/transport/metro) and a shared directory page (/services/:cat) for
// Bus, Parking, Police, Hospital, ATM, Pharmacy, Toilet and Help Desk.
//
// HONESTY: this is STATIC SAMPLE / reference data, exactly like the metro
// timetable already shown on PandalDetail. Timings, fares, routes and
// locations are representative of Kolkata, not a live feed, and every page
// captions them "sample — verify on-site". No real-time closure or service
// disruption is ever fabricated here — advisories only ever come from a real
// authority feed (see services/authority.ts), never invented.
import type {
  BusRoute, DirectoryItem, MetroLine, ServiceCategory, ServiceDirectory,
} from './types'
import { bloodBanks, parkingSpots, safetyPoints } from './demo'

// ─── Metro lines (schematic, sample) ────────────────────────────────────────
// `stations` run in travel order so the strip diagram and the station list
// can never disagree. Interchange names must appear on two lines' `stations`.
export const metroLines: MetroLine[] = [
  {
    id: 'blue', name: 'Blue Line (Line 1)', short: 'Line 1', color: '#2563EB',
    terminals: ['Dum Dum', 'Dakshineswar'],
    stations: ['Dum Dum', 'Kankurgachi', 'Beliaghata', 'Happy Villa', 'Noappara', 'Jotwa', 'Sinthee', 'Dakin Haat', 'Shyambazar', 'Bibhutibhushan', 'Belgachhia', 'Mirza Ghulam Baig', 'Kankuri Bagh', 'Shyama Prasad Mukherjee', 'Girish Park', 'Mahananda', 'Rabindra Sadan', 'Netaji Bhawan', 'Maidan', 'Kalighat', 'Hitalli', 'Ganesh Chandra Avenue', 'New Garia'],
    interchange: ['Mahananda', 'Rabindra Sadan', 'Netaji Bhawan'],
    firstTrain: '6:00 AM', lastTrain: '10:00 PM', headwayMin: 5, fareRange: [5, 25],
    note: 'North–South spine. Park Street / Maidan side connects the metro to most South Kolkata pandal clusters.',
  },
  {
    id: 'purple', name: 'Purple Line (Line 2)', short: 'Line 2', color: '#7C3AED',
    terminals: ['Howrah Maidan', 'Sector V'],
    stations: ['Howrah Maidan', 'Bata', 'Kona', 'Natabar', 'Chhota Jagulia', 'Bidhannagar', 'Salt Lake Sector V'],
    interchange: [],
    firstTrain: '6:15 AM', lastTrain: '10:30 PM', headwayMin: 8, fareRange: [10, 40],
    note: 'East–west cross-river corridor. Sample timings — check for the current operational stretch before travelling.',
  },
  {
    id: 'green', name: 'Green Line (Line 3)', short: 'Line 3', color: '#16A34A',
    terminals: ['Koley Market', 'Jadavpur'],
    stations: ['Koley Market', 'Harinalbaug', 'Ballygunge', 'Navyug', 'Netaji Bhawan', 'Radha Govind Metro', 'Sayed Hasan Sarani', 'Mahananda', 'Khudiram Bose', 'Jadavpur'],
    interchange: ['Netaji Bhawan', 'Mahananda'],
    firstTrain: '6:15 AM', lastTrain: '11:30 PM', headwayMin: 8, fareRange: [5, 20],
    note: 'Serves the Bowbazar / Santosh Mitra cluster via Koley Market and reaches Jadavpur in the south.',
  },
  {
    id: 'orange', name: 'Orange Line (Line 4)', short: 'Line 4', color: '#EA580C',
    terminals: ['Esplanade', 'Baranagar'],
    stations: ['Esplanade', 'Sealdah', 'Kankurgachi', 'Beliaghata', 'Baranagar'],
    interchange: ['Kankurgachi'],
    firstTrain: '6:20 AM', lastTrain: '11:00 PM', headwayMin: 6, fareRange: [10, 30],
    note: 'Connects Sealdah suburban rail to the northern suburbs. Partial stretch in service — verify before travelling.',
  },
]

/** Flat, de-duplicated station roster with the line ids that touch each one. */
export interface MetroStation {
  name: string
  lines: string[]
  interchange: boolean
}
export const metroStations: MetroStation[] = (() => {
  const map = new Map<string, string[]>()
  for (const l of metroLines) {
    for (const s of l.stations) map.set(s, [...(map.get(s) ?? []), l.id])
  }
  return [...map.entries()]
    .map(([name, lines]) => ({ name, lines, interchange: lines.length > 1 }))
    .sort((a, b) => Number(b.interchange) - Number(a.interchange) || a.name.localeCompare(b.name))
})()

/** Puja-week advisory panel. Always empty here on purpose: a closure or
    maintenance notice is only ever real when it comes from the authority feed,
    never invented. The Metro page reads this to prove "no live advisory". */
export const metroServiceAdvisories: { lineId: string; text: string }[] = []

// ─── Bus routes (representative sample) ─────────────────────────────────────
export const busRoutes: BusRoute[] = [
  { id: 'b-24c', name: 'Bus 24C', from: 'Gariahat', to: 'Shyambazar', via: ['Lake Market', 'Kalighat', 'Maidan', 'Park Street', 'Sealdah'], type: 'Normal', firstTrip: '5:30 AM', lastTrip: '11:00 PM', frequencyMin: 12, fareINR: [8, 15], pujaNote: 'Passes Mudiali & Ekdalia clusters — expect diversions on Ashtami/Navami.' },
  { id: 'b-s4', name: 'AC Bus S4', from: 'Salt Lake Sector V', to: 'Ballygunge', via: ['Kankurgachi', 'Park Street', 'Maidan'], type: 'AC', firstTrip: '6:00 AM', lastTrip: '10:30 PM', frequencyMin: 20, fareINR: [15, 30] },
  { id: 'b-dak', name: 'Bus Dakshineswar Route', from: 'Hazra', to: 'Dakshineswar', via: ['Shyambazar', 'Girish Park', 'Belgachhia'], type: 'Normal', firstTrip: '5:45 AM', lastTrip: '10:15 PM', frequencyMin: 15, fareINR: [10, 18], pujaNote: 'Bleeds into the North Kolkata pandal belt around Dashami.' },
  { id: 'b-circular', name: 'Puja Circuit (special)', from: 'Maidan', to: 'Maidan', via: ['Park Street', 'Gariahat', 'Kalighat', 'Ballygunge'], type: 'Circular', firstTrip: '4:00 PM', lastTrip: '1:00 AM', frequencyMin: 10, fareINR: [10, 20], pujaNote: 'Sample of the puja-week night loop — exact runs are set by WBTC each year.' },
  { id: 'b-7', name: 'Bus 7/7A', from: 'Esplanade', to: 'Baranagar Bazaar', via: ['Sealdah', 'Kankurgachi', 'Beliaghata'], type: 'Normal', firstTrip: '6:00 AM', lastTrip: '10:00 PM', frequencyMin: 14, fareINR: [8, 15] },
  { id: 'b-170', name: 'Bus 170', from: 'Howrah Bridge', to: 'New Garia', via: ['Maidan', 'Ballygunge', 'Lake Town'], type: 'Normal', firstTrip: '5:30 AM', lastTrip: '10:45 PM', frequencyMin: 16, fareINR: [10, 20] },
]

// ─── Point directories ──────────────────────────────────────────────────────

/** Parking grounds — derived from the same seed the pandal pages use, so the
    two screens never disagree on a lot's rate or capacity. */
const parkingItems: DirectoryItem[] = parkingSpots.map((p) => ({
  id: p.id,
  name: p.name,
  area: p.area,
  subtitle: `≈ ${p.walkTimeMin} min walk · capacity ${p.capacityHint}`,
  meta: `₹${p.ratePerHour}/h`,
  tags: p.nearestPandalIds.length ? ['Serves nearby pandals'] : undefined,
  lat: p.lat,
  lng: p.lng,
}))

/** Police stations — one real reference booth plus clearly-generic sample posts. */
const policeItems: DirectoryItem[] = [
  ...safetyPoints.filter((s) => s.kind === 'police').map((s) => ({ id: s.id, name: s.detail, area: 'Central Kolkata', meta: `${s.distanceM} m from hub`, lat: s.lat, lng: s.lng })),
  { id: 'ps-2', name: 'Baghbazar Police Station', area: 'Baghbazar', phone: '100', hours: '24/7' },
  { id: 'ps-3', name: 'Beliaghata Police Station', area: 'Beliaghata', phone: '100', hours: '24/7' },
  { id: 'ps-4', name: 'Gariahat Police Station', area: 'Gariahat', phone: '100', hours: '24/7' },
  { id: 'ps-5', name: 'Jorwe Police Station', area: 'Kalighat', phone: '100', hours: '24/7' },
]

/** Hospitals & medical — reuses the app's real hospital / blood-bank roster. */
const hospitalItems: DirectoryItem[] = [
  ...safetyPoints.filter((s) => s.kind === 'medical').map((s) => ({ id: s.id, name: s.detail, area: 'Puja medical camp', meta: `${s.distanceM} m from hub`, lat: s.lat, lng: s.lng })),
  ...bloodBanks.map((b) => ({ id: b.id, name: b.hospital, area: b.area, subtitle: b.name, hours: b.hours, phone: b.phone, tags: b.availableGroups })),
]

/** Help desks / control rooms — sample puja operational posts. */
const helpdeskItems: DirectoryItem[] = [
  ...safetyPoints.filter((s) => s.kind === 'helpdesk' || s.kind === 'lostfound').map((s) => ({ id: s.id, name: s.detail, area: s.name, meta: `${s.distanceM} m from hub`, lat: s.lat, lng: s.lng })),
  { id: 'hd-2', name: 'Municipal Puja Help Desk', area: 'Ballygunge', phone: '33-2241-5000', hours: '8 AM – 2 AM', subtitle: 'Lost & found, first aid, complaints' },
  { id: 'hd-3', name: 'Traffic Control Booth', area: 'Park Street', hours: '24/7', subtitle: 'Route & parking assistance' },
  { id: 'hd-4', name: 'Women Helpline Booth', area: 'Gariahat', phone: '1091', hours: '24/7' },
]

/** ATM clusters — generic (no specific bank branch is claimed as verified). */
const atmItems: DirectoryItem[] = [
  { id: 'atm-1', name: 'ATM Lobby — multiple banks', area: 'Gariahat', hours: '24/7', subtitle: 'Cluster of 6+ ATMs', lat: 22.5195, lng: 88.3610 },
  { id: 'atm-2', name: 'ATM — Park Street circle', area: 'Park Street', hours: '24/7', lat: 22.5458, lng: 88.3560 },
  { id: 'atm-3', name: 'ATM — Lake Market', area: 'Lake Market', hours: '9 AM – 11 PM', lat: 22.5150, lng: 88.3350 },
  { id: 'atm-4', name: 'ATM — Sealdah station forecourt', area: 'Sealdah', hours: '24/7', subtitle: 'High traffic, expect queues at puja' },
  { id: 'atm-5', name: 'ATM — Quest Mall', area: 'Chowringhee', hours: 'Mall hours', subtitle: 'Indoor, air-conditioned' },
  { id: 'atm-6', name: 'ATM — Southern Avenue', area: 'Ballygunge', hours: '24/7' },
]

/** Pharmacies — generic sample listings (illustrative, not verified partners). */
const pharmacyItems: DirectoryItem[] = [
  { id: 'rx-1', name: '24×7 Chemist', area: 'Gariahat', hours: '24/7', subtitle: 'Night counter open during puja week' },
  { id: 'rx-2', name: 'Medical store — Lake Market', area: 'Lake Market', hours: '8 AM – 11 PM' },
  { id: 'rx-3', name: 'Chemist — Ballygunge Station', area: 'Ballygunge', hours: '9 AM – 10 PM', lat: 22.5270, lng: 88.3600 },
  { id: 'rx-4', name: 'First-aid supplies — Sealdah', area: 'Sealdah', hours: '7 AM – 12 AM' },
  { id: 'rx-5', name: 'Medical store — Kalighat', area: 'Kalighat', hours: '9 AM – 10 PM' },
  { id: 'rx-6', name: '24×7 Chemist — Park Street', area: 'Park Street', hours: '24/7' },
]

/** Public toilets — sample municipal / venue locations. */
const toiletItems: DirectoryItem[] = [
  { id: 'wc-1', name: 'Municipal public toilet', area: 'Gariahat', hours: '6 AM – 10 PM', subtitle: 'Paid, maintained', lat: 22.5195, lng: 88.3610 },
  { id: 'wc-2', name: 'Public convenience — Maidan', area: 'Maidan', hours: '6 AM – 10 PM' },
  { id: 'wc-3', name: 'Toilet — Howrah Station', area: 'Howrah', hours: '24/7' },
  { id: 'wc-4', name: 'Mall restrooms — Quest Mall', area: 'Chowringhee', hours: 'Mall hours', subtitle: 'Cleanest option in the area' },
  { id: 'wc-5', name: 'Temporary puja toilet', area: 'Baghbazar', hours: 'Puja week only', subtitle: 'Deployed by the local puja committee' },
  { id: 'wc-6', name: 'Metro station restroom', area: 'Park Street', hours: 'Station hours' },
]

type PointCategory = Exclude<ServiceCategory, 'bus'>
const POINTS: Record<PointCategory, DirectoryItem[]> = {
  parking: parkingItems,
  police: policeItems,
  hospital: hospitalItems,
  helpdesk: helpdeskItems,
  atm: atmItems,
  pharmacy: pharmacyItems,
  toilet: toiletItems,
}

/** Directory metadata that turns a `:cat` key into a rendered page header. */
export const SERVICE_DIRECTORIES: Record<ServiceCategory, ServiceDirectory> = {
  bus: { id: 'bus', title: 'City Bus', titleBn: 'বাস', kind: 'route', blurb: 'Key bus corridors that reach the major pandal clusters, with first/last trips, frequency and indicative fare.', disclaimer: 'Representative sample routes and timings — confirm live schedules with WBTC; many run on diversion during puja week.' },
  parking: { id: 'parking', title: 'Parking', titleBn: 'পার্কিং', kind: 'point', blurb: 'Paid lots and grounds near the big pandal clusters, with walk time and indicative hourly rate.', disclaimer: 'Capacity varies on puja evenings — verify on-site. Most pandal areas are no-parking during puja week.' },
  police: { id: 'police', title: 'Police Stations', titleBn: 'পুলিশ স্টেশন', kind: 'point', blurb: 'Stations and reference booths for the puja belt. For any emergency, dial 112.', disclaimer: 'Reference list — for urgent help always call 112 first.', phoneNote: 'Emergency: 112' },
  hospital: { id: 'hospital', title: 'Hospitals & Medical', titleBn: 'হাসপাতাল', kind: 'point', blurb: 'Hospitals, puja medical camps and blood banks, with hours and phone where available.', disclaimer: 'Blood availability is illustrative — always phone before travelling. For emergencies call 112.' },
  helpdesk: { id: 'helpdesk', title: 'Help Desks', titleBn: 'হেল্প ডেস্ক', kind: 'point', blurb: 'Control rooms, lost & found and assistance booths across the puja areas.', disclaimer: 'Sample puja-week posts — the Safety Center lists live help desks when an authority feed is active.', phoneNote: 'Women helpline: 1091' },
  atm: { id: 'atm', title: 'ATMs', titleBn: 'এটিএম', kind: 'point', blurb: 'ATM clusters around the pandal areas. Carry cash — many puja stalls are cash-only.', disclaimer: 'Illustrative sample locations, not verified bank branches — use your banking app or maps for live locations.' },
  pharmacy: { id: 'pharmacy', title: 'Pharmacies', titleBn: 'ফার্মেসি', kind: 'point', blurb: 'Chemists and 24×7 counters near the pandal clusters, handy for first-aid supplies.', disclaimer: 'Illustrative sample listings, not verified partners — confirm timings on the map before travelling.' },
  toilet: { id: 'toilet', title: 'Public Toilets', titleBn: 'টয়লেট', kind: 'point', blurb: 'Municipal, station and venue restrooms across the puja belt.', disclaimer: 'Illustrative sample locations — availability and maintenance vary; check on-site.' },
}

/** Look up the point rows for a directory category ('bus' has none). */
export function directoryItems(cat: ServiceCategory): DirectoryItem[] {
  return cat === 'bus' ? [] : POINTS[cat]
}
