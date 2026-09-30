// ─── Demo dataset — real Kolkata pandals, restaurants & places ─────────────
// Names, areas, themes and metro stations are real; ratings, crowds, timings,
// reviews and photos are ILLUSTRATIVE DEMO CONTENT for UI development.
import type {
  CategoryDef, Dish, EventItem, Meetup, Offer, Palette, Place, SafetyPoint, ShoppingProduct, SponsoredItem,
} from './types'

export const IS_DEMO = true

const p = (from: string, to: string): Palette => ({ from, to })
// Warm puja-light palettes
const lamp = p('#3a2410', '#8a5a1e')
const fire = p('#4a1508', '#a8401c')
const dusk = p('#1a1230', '#4a3070')
const marigold = p('#5c3a0a', '#c08a2a')
const night = p('#120c08', '#38241a')
const silk = p('#4a1230', '#963a5c')
const brass = p('#2a1e0c', '#7a5a24'  )
const clay = p('#38200e', '#8a5230')

const dishes: Dish[] = [
  { id: 'd1', name: 'Kocha Mango', nameBn: 'কচা আম', palette: marigold },
  { id: 'd2', name: 'Bhetki Paturi', nameBn: 'ভেটকি পাটুরি', palette: clay },
  { id: 'd3', name: 'Mishti Doi', nameBn: 'মিষ্টি দই', palette: lamp },
  { id: 'd4', name: 'Kosha Mangsho', nameBn: 'কোষা মাংস', palette: fire },
  { id: 'd5', name: 'Chingri Malaikari', nameBn: 'চিংড়ি মলাইকারি', palette: brass },
  { id: 'd6', name: 'Luchi Alur Dom', nameBn: 'লুচি আলু দম', palette: silk },
]

const rReviews = [
  { id: 'rv1', author: 'A. Chatterjee', rating: 5, text: 'The lighting…', date: '2025-10-01' },
]

export const places: Place[] = [
  // ── Pandals ──────────────────────────────────────────────────────────────
  {
    id: 'pandal-santosh-mitra', type: 'pandal', name: 'Santosh Mitra Square', nameBn: 'সন্তোষ মিত্র স্কোয়ার',
    subtitle: 'Santosh Mitra Square Club', area: 'Central Kolkata', lat: 22.5473, lng: 88.3573,
    rating: 4.8, reviewCount: 2300, distanceKm: 2.4, crowd: 'high', theme: 'The Eternal City',
    story: 'Inspired by the rich cultural heritage of Bengal, this year\'s theme brings to life the journey of humanity through time, blending tradition with modern artistry.',
    storyBn: 'বাংলার সমৃদ্ধ সাংস্কৃতিক ঐতিহ্য থেকে অনুপ্রাণিত হয়ে এবারের থিম জীবনযাপন, রন্ধন প্রভৃতি মানবজাতনার যাত্রাকে আধুনিক শিল্পের মাধ্যমে তুলে ধরে।',
    artist: 'Unknown artist', openTill: '2:00 AM', metro: 'Koley Market (Green Line)',
    facilities: ['Help Desk', 'Medical Camp'], palette: lamp,
    pastEditions: [
      { year: 2024, theme: 'Egyptian Heritage', palette: dusk },
      { year: 2023, theme: 'Titanic', palette: night },
      { year: 2022, theme: 'Ram Mandir Ayodhya', palette: marigold },
    ],
    reviews: [
      { id: 'rv1', author: 'Rahul Sen', rating: 5, text: 'This year\'s theme installation is breathtaking. The scale of the artistry is unmatched in Central Kolkata.', date: '2025-10-04' },
      { id: 'rv2', author: 'Priya D.', rating: 4, text: 'Crowded post 9 PM but the queue moves well. Worth it for the evening light show.', date: '2025-10-03' },
    ],
    topClicks: [
      { id: 'ph1', title: 'Golden hour at the Square', author: 'S. Bose', palette: marigold, likes: 412 },
      { id: 'ph2', title: 'Theme detail close-up', author: 'M. Khan', palette: lamp, likes: 308 },
      { id: 'ph3', title: 'Night panorama', author: 'A. Ghosh', palette: night, likes: 276 },
    ],
  },
  {
    id: 'pandal-kalyani-iti', type: 'pandal', name: 'Kalyani ITI More', nameBn: 'কল্যাণী আইটিআই মোড়',
    subtitle: 'Kalyani ITI Club', area: 'North Kolkata', lat: 22.6045, lng: 88.3702,
    rating: 4.5, reviewCount: 1400, distanceKm: 3.8, crowd: 'moderate', theme: 'Rustic Bengal',
    story: 'Village artisans recreate everyday rural Bengal — terracotta, thatch and hand-painted panels — on one of the busiest stretches of North Kolkata.',
    openTill: '1:00 AM', metro: 'Koley Market (Green Line)', facilities: ['Help Desk'], palette: clay,
    pastEditions: [
      { year: 2024, theme: 'Terracotta Temples', palette: fire },
      { year: 2023, theme: 'Bohaag of Bengal', palette: brass },
    ],
    reviews: [
      { id: 'rv3', author: 'S. Mukhopadhyay', rating: 5, text: 'The terracotta work is authentic and beautiful. Feels like stepping into a village.', date: '2025-10-02' },
    ],
    topClicks: [
      { id: 'ph4', title: 'Hand-painted panels', author: 'R. Das', palette: clay, likes: 190 },
      { id: 'ph5', title: 'Evening crowd glow', author: 'T. Saha', palette: lamp, likes: 150 },
      { id: 'ph6', title: 'Artisan at work', author: 'K. Roy', palette: brass, likes: 131 },
    ],
  },
  {
    id: 'pandal-baghbazar', type: 'pandal', name: 'Baghbazar Sarbojanin', nameBn: 'বাগবাজার সার্বজনীন',
    subtitle: 'Baghbazar Sarbojanin Durgotsab', area: 'North-East Kolkata', lat: 22.5803, lng: 88.3738,
    rating: 4.6, reviewCount: 1900, distanceKm: 3.2, crowd: 'low', theme: 'Heritage Bengal',
    story: 'One of Kolkata\'s oldest barowari pujas, known for its traditional dhak beats and heritage-style pandal recreating old Calcutta courtyards.',
    openTill: '11:30 PM', metro: 'Pyne Bazar (Purple Line)', facilities: ['Help Desk', 'Medical Camp'], palette: dusk,
    pastEditions: [
      { year: 2024, theme: 'Shobhabazar Rajbari', palette: marigold },
      { year: 2023, theme: 'Court of the Nawabs', palette: silk },
    ],
    reviews: [
      { id: 'rv4', author: 'A. Bhaduri', rating: 5, text: 'The dhak taal at evening aarati is goosebump-worthy. A puja with soul.', date: '2025-10-01' },
    ],
    topClicks: [
      { id: 'ph7', title: 'Dhak ensemble', author: 'P. Ghosh', palette: dusk, likes: 220 },
    ],
  },
  {
    id: 'pandal-deshapriya', type: 'pandal', name: 'Deshapriya Park', nameBn: 'দেশপ্রিয়া পার্ক',
    subtitle: 'Deshapriya Park Sangharsh Samiti', area: 'South Kolkata', lat: 22.5077, lng: 88.3409,
    rating: 4.7, reviewCount: 2100, distanceKm: 1.2, crowd: 'moderate', theme: 'A Journey Through Time',
    story: 'Famous for its towering, meticulously crafted art installations, Deshapriya Park\'s pandal is a South Kolkata landmark every puja.',
    openTill: '2:00 AM', metro: 'Netaji Bhawan (Blue Line)', facilities: ['Help Desk', 'Parking'], palette: fire,
    pastEditions: [
      { year: 2024, theme: 'Maa in the Clouds', palette: dusk },
      { year: 2023, theme: '20 000 Yojana', palette: night },
    ],
    reviews: [
      { id: 'rv5', author: 'S. Chatterjee', rating: 5, text: 'The scale of the pandal this year is on another level. Queue was smooth till midnight.', date: '2025-10-05' },
    ],
    topClicks: [
      { id: 'ph8', title: 'The tower at dusk', author: 'D. Sarkar', palette: fire, likes: 355 },
      { id: 'ph9', title: 'Lighting the path', author: 'J. Paul', palette: lamp, likes: 210 },
    ],
  },
  {
    id: 'pandal-ekdalia', type: 'pandal', name: 'Ekdalia Evergreen', nameBn: 'একডালিয়া এভারগ্রীন',
    subtitle: 'Ekdalia Evergreen Club', area: 'South Kolkata', lat: 22.5244, lng: 88.3618,
    rating: 4.7, reviewCount: 1700, distanceKm: 2.1, crowd: 'high', theme: 'Traditional Barowari',
    story: 'A 100+-year-old puja, the archetype of Kolkata barowari tradition — the chhowk, the dhak, and the unforgettable pushpanjali.',
    openTill: '11:45 PM', metro: 'Radha Govind Metro (Orange Line)', facilities: ['Help Desk'], palette: brass,
    pastEditions: [
      { year: 2024, theme: 'Century of Tradition', palette: marigold },
    ],
    reviews: [
      { id: 'rv6', author: 'M. Basu', rating: 5, text: 'If you want to understand what Puja means to Kolkata, come here on Ashtami morning.', date: '2025-10-03' },
    ],
  },
  {
    id: 'pandal-mudiali', type: 'pandal', name: 'Mudiali Club', nameBn: 'মুড়িয়ালি ক্লাব',
    subtitle: 'Mudiali Club', area: 'South Kolkata', lat: 22.5155, lng: 88.3340,
    rating: 4.6, reviewCount: 1300, distanceKm: 1.8, crowd: 'moderate', theme: 'Art-measured Lines',
    story: 'Known for clean architectural lines and light-play that changes the pandal\'s face every hour of the evening.',
    openTill: '1:00 AM', metro: 'Netaji Bhawan (Blue Line)', facilities: ['Help Desk', 'Parking'], palette: silk,
    pastEditions: [
      { year: 2024, theme: 'Circles of Light', palette: dusk },
    ],
  },
  {
    id: 'pandal-suruchi', type: 'pandal', name: 'Suruchi Sangha', nameBn: 'সুরুচি সংঘ',
    subtitle: 'Suruchi Sangha', area: 'South Kolkata', lat: 22.5010, lng: 88.3480,
    rating: 4.7, reviewCount: 1800, distanceKm: 1.5, crowd: 'high', theme: 'Heritage of India',
    story: 'Behala\'s flagship puja — every year a landmark art installation by a celebrated artist draws lakhs of visitors.',
    openTill: '2:00 AM', metro: 'Hemanta Mukherjee (Blue Line)', facilities: ['Help Desk', 'Medical Camp', 'Parking'], palette: marigold,
    pastEditions: [
      { year: 2024, theme: 'Biswa Biswarani', palette: fire },
      { year: 2023, theme: 'Chander Kancha', palette: dusk },
    ],
  },
  {
    id: 'pandal-tridhara', type: 'pandal', name: 'Tridhara Samiti', nameBn: 'ত্রিধারা সমিতি',
    subtitle: 'Tridhara Sporting Club', area: 'South Kolkata', lat: 22.5262, lng: 88.3540,
    rating: 4.5, reviewCount: 1200, distanceKm: 2.3, crowd: 'low', theme: 'Three Worlds',
    story: 'A Lala-bazar-born tradition now blooming in Ballygunge — famed for its pushpanjali at dusk and a calmer queue.',
    openTill: '11:30 PM', metro: 'Radha Govind Metro (Orange Line)', facilities: ['Help Desk'], palette: night,
  },
  // ── Restaurants ──────────────────────────────────────────────────────────
  {
    id: 'rest-oh-calcutta', type: 'restaurant', name: 'Oh! Calcutta', area: 'Ballygunge', lat: 22.5280, lng: 88.3580,
    rating: 4.5, reviewCount: 2300, distanceKm: 1.1, cuisine: 'Bengali, Continental', priceBand: '₹₹',
    openNow: true, hours: '12:00 PM – 11:30 PM', metro: 'Radha Govind Metro', facilities: ['Parking'],
    palette: brass, popularDishes: dishes.slice(0, 3), reviews: rReviews,
  },
  {
    id: 'rest-6-ballygunge', type: 'restaurant', name: '6 Ballygunge Place', area: 'Ballygunge', lat: 22.5290, lng: 88.3620,
    rating: 4.3, reviewCount: 3100, distanceKm: 1.8, cuisine: 'Bengali', priceBand: '₹₹',
    openNow: true, hours: '12:00 PM – 11:00 PM', metro: 'Netaji Bhawan', facilities: ['Parking'],
    palette: clay, popularDishes: dishes.slice(2, 5),
  },
  {
    id: 'rest-kasturi', type: 'restaurant', name: 'Kasturi', area: 'Dhakuria', lat: 22.5060, lng: 88.3330,
    rating: 4.4, reviewCount: 900, distanceKm: 2.6, cuisine: 'Bengali', priceBand: '₹₹',
    openNow: true, hours: '7:00 AM – 10:30 PM', metro: 'Hemanta Mukherjee', facilities: [],
    palette: lamp, popularDishes: [dishes[3], dishes[5]],
  },
  {
    id: 'rest-aromas', type: 'restaurant', name: 'Aromas', area: 'Gariahat', lat: 22.5200, lng: 88.3600,
    rating: 4.2, reviewCount: 1500, distanceKm: 2.0, cuisine: 'Multi-cuisine', priceBand: '₹₹',
    openNow: false, hours: '11:00 AM – 11:00 PM', metro: 'Radha Govind Metro', facilities: [],
    palette: silk, popularDishes: [dishes[1], dishes[4]],
  },
  {
    id: 'rest-urshta', type: 'restaurant', name: 'Urshta', area: 'Ekdalia', lat: 22.5230, lng: 88.3630,
    rating: 4.4, reviewCount: 700, distanceKm: 2.2, cuisine: 'Modern Indian', priceBand: '₹₹₹',
    openNow: true, hours: '1:00 PM – 10:30 PM', metro: 'Radha Govind Metro', facilities: [],
    palette: dusk, popularDishes: [dishes[0], dishes[2]],
  },
  {
    id: 'rest-mithai', type: 'restaurant', name: 'Kewpie\'s Kitchen', area: 'Jadavpur', lat: 22.4950, lng: 88.3680,
    rating: 4.1, reviewCount: 500, distanceKm: 3.4, cuisine: 'Bengali, Chinese', priceBand: '₹',
    openNow: true, hours: '10:00 AM – 10:00 PM', metro: 'Jadavpur (Green Line)', facilities: [],
    palette: fire, popularDishes: [dishes[5]],
  },
]

export const pandals = places.filter((x) => x.type === 'pandal')
export const restaurants = places.filter((x) => x.type === 'restaurant')
export const placeById = (id: string) => places.find((x) => x.id === id)

export const spotlight = {
  id: 'spotlight-deshapriya',
  placeId: 'pandal-deshapriya',
  title: 'Deshapriya Park',
  description: 'Theme: A Journey Through Time',
}

export const sponsored: SponsoredItem = {
  id: 'sp1', brand: 'Tanting', title: 'Tanting',
  description: 'Centuries of tradition with timeless elegance.',
  palette: { ...p('#241019', '#6e2334'), img: '/img/tanting-saree.jpg' },
}

export const events: EventItem[] = [
  { id: 'e1', name: 'Dhak Performance — Sandhya Aarati', date: 'Oct 10', time: '6:30 PM', venue: 'Baghbazar Sarbojanin', category: 'Culture', palette: dusk },
  { id: 'e2', name: 'Pandal Photography Walk', date: 'Oct 11', time: '5:00 PM', venue: 'South Kolkata cluster', category: 'Photography', palette: lamp },
  { id: 'e3', name: 'Adda & Music — Puja Night', date: 'Oct 12', time: '8:00 PM', venue: 'Gariahat Junction', category: 'Music', palette: silk },
  { id: 'e4', name: 'Kumartuli Artist Studio Visits', date: 'Oct 9', time: '11:00 AM', venue: 'Kumortuli', category: 'Heritage', palette: clay },
]

export const offers: Offer[] = [
  { id: 'o1', brand: 'Axis Bank Cards', title: '10% instant discount on EMI', description: 'Across electronics & appliances, up to ₹7,500 off.', code: 'PUJOEMI', palette: { ...dusk, img: '/img/offer-card.jpg' } },
  { id: 'o2', brand: 'Titan Raga', title: 'Festive watches from ₹4,999', description: 'Free engraving + 10% off on card payments.', code: 'TIME10', palette: { ...brass, img: '/img/offer-watch.jpg' } },
  { id: 'o3', brand: 'Manyavar', title: 'Up to 40% off ethnic wear', description: 'Kurta & sherwani picks for Durga Puja.', code: 'SHARAD40', palette: { ...fire, img: '/img/offer-apparel.jpg' } },
  { id: 'o4', brand: 'Bata', title: 'Buy 1 Get 1 on footwear', description: 'Formals, casuals and the kids\' range.', code: 'STRIDE', palette: { ...lamp, img: '/img/offer-shoes.jpg' } },
  { id: 'o5', brand: 'Samsung', title: 'No-cost EMI on the new Galaxy', description: 'Extra ₹5,000 exchange bonus this Pujo.', code: 'GADGET5', palette: { ...night, img: '/img/offer-gadgets.jpg' } },
  { id: 'o6', brand: 'Balaram Mullick', title: 'Puja mishti gift boxes', description: 'Assorted sweets, home delivery citywide.', code: 'MITHAI', palette: { ...marigold, img: '/img/offer-sweets.jpg' } },
]

/**
 * Shopping — best-selling Durga Puja sale picks from real Kolkata-area malls
 * and traditional shopping hubs. In production this is replaced by an
 * aggregated feed from mall partner APIs + in-store catalogs; today it's demo
 * content that mirrors what a shopper actually finds at these destinations
 * during Sharad sales (Baluchari sarees at Mani Square, shakha-pola at Fancy
 * Bazaar, festive kidswear at South City, etc.). Mall names and neighborhoods
 * are real; prices, discounts, and stock are illustrative.
 */
export const shopping: ShoppingProduct[] = [
  { id: 's1', name: 'Baluchari Silk Saree', nameBn: 'বালাচর রেশম শাড়ি', mall: 'Mani Square', area: 'Kankurgachi', category: 'Saree', price: 8499, originalPrice: 12900, discountPct: 34, tag: 'Bestseller', palette: silk },
  { id: 's2', name: 'Handloom Tant Pujo Saree', nameBn: 'হাতে বোনা টান্ট শাড়ি', mall: 'Gariahat Saree Centre', area: 'Gariahat', category: 'Saree', price: 1899, originalPrice: 2800, discountPct: 32, tag: 'Handloom', palette: fire },
  { id: 's3', name: 'Shakha-Pola Conch & Coral Set', nameBn: 'শাখা-পলা সেট', mall: 'Fancy Bazaar', area: 'Bara Bazaar', category: 'Jewellery', price: 899, originalPrice: 1450, discountPct: 38, tag: 'Traditional', palette: lamp },
  { id: 's4', name: 'Gold-Plated Chandor Haar', nameBn: 'চাঁদোহার হার', mall: 'PC Chandra Jewellers', area: 'Siddharth Sarani', category: 'Jewellery', price: 4999, originalPrice: 7500, discountPct: 33, palette: marigold },
  { id: 's5', name: "Girls' Frock Lehenga", nameBn: 'মেয়েদের ফ্রক লেহেনা', mall: 'South City', area: 'Mukundapur', category: 'Kids', price: 3499, originalPrice: 5500, discountPct: 36, tag: 'Bestseller', palette: dusk },
  { id: 's6', name: 'Handwoven Dhuti-Kurta Set', nameBn: 'ধুতি-কুর্তা সেট', mall: 'City Centre', area: 'Salt Lake', category: 'Kurta', price: 2199, originalPrice: 3200, discountPct: 31, tag: 'Handloom', palette: clay },
  { id: 's7', name: 'Mojari Ethnic Jutti (Pair)', nameBn: 'মোজারি জুতি', mall: 'Quest Mall', area: 'Ballygunge', category: 'Footwear', price: 1599, originalPrice: 2400, discountPct: 33, palette: brass },
  { id: 's8', name: 'Brass Pujo Thali 7-Piece', nameBn: 'পিতলের পুজোর থালি', mall: 'Bangiya Sahaji Bazaar', area: 'Chandni Chowk', category: 'Puja Essentials', price: 1249, originalPrice: 1900, discountPct: 34, tag: 'Pujo Essential', palette: night },
  { id: 's9', name: 'Hand-Painted Jute Tote', nameBn: 'হাতে আঁকা পাটের টোট ব্যাগ', mall: 'Lake Market', area: 'Ballygunge', category: 'Bags', price: 549, originalPrice: 899, discountPct: 39, tag: 'Trending', palette: silk },
  { id: 's10', name: 'Kantha Handwork Quilt', nameBn: 'কাথা মনের কাঁথা', mall: 'Great East World', area: 'Rajarhat', category: 'Home Decor', price: 3850, originalPrice: 5200, discountPct: 26, tag: 'Handcrafted', palette: marigold },
]

export const meetups: Meetup[] = [
  { id: 'm1', title: 'South Kolkata Pandal Hop', date: 'Sat, 12 Oct', time: '7:00 PM', location: 'Gariahat', lat: 22.5195, lng: 88.3660, description: 'A curated evening covering Deshapriya, Mudiali and Suruchi. Easy pace, great adda.', interests: ['Pandal hopping', 'Food'], attendees: 12, maxParticipants: 20, visibility: 'public', palette: fire, host: 'Pujo Sahayak Members' },
  { id: 'm2', title: 'Photography Walk', date: 'Sun, 13 Oct', time: '5:00 PM', location: 'Maidan', lat: 22.5400, lng: 88.3550, description: 'Golden-hour to night-lights. Bring your wide angle — we shoot pandals and people.', interests: ['Photography', 'Art'], attendees: 8, maxParticipants: 12, visibility: 'public', palette: dusk, host: 'Kolkata Lens Club' },
  { id: 'm3', title: 'Late-night Puja Food Crawl', date: 'Mon, 14 Oct', time: '9:30 PM', location: 'Park Street', lat: 22.5460, lng: 88.3570, description: 'Roll, biryani, cha and phuchka — the after-puja food trail for night explorers.', interests: ['Food', 'Night exploration'], attendees: 15, maxParticipants: 15, visibility: 'restricted', palette: night, host: 'Backstreet Bites' },
  { id: 'm4', title: 'Heritage Barowari Trail', date: 'Fri, 11 Oct', time: '4:00 PM', location: 'North Kolkata', lat: 22.5803, lng: 88.3738, description: 'Ekdalia to Baghbazar on foot — the century-old pujas and the stories between them.', interests: ['Heritage', 'Pandal hopping'], attendees: 6, maxParticipants: 10, visibility: 'public', palette: brass, host: 'Kolkata At It\'s Best' },
]

export const safetyPoints: SafetyPoint[] = [
  { id: 's1', kind: 'police', name: 'Police Station', detail: 'Ballygunge Police Station', distanceM: 120, lat: 22.5270, lng: 88.3600 },
  { id: 's2', kind: 'medical', name: 'Medical Camp', detail: 'Deshapriya Puja Medical Camp', distanceM: 230, lat: 22.5085, lng: 88.3415 },
  { id: 's3', kind: 'helpdesk', name: 'Help Desk', detail: 'Puja Central Control Room', distanceM: 150, lat: 22.5250, lng: 88.3580 },
  { id: 's4', kind: 'lostfound', name: 'Lost & Found', detail: 'Deshapriya Park Help Desk', distanceM: 180, lat: 22.5080, lng: 88.3410 },
  { id: 's5', kind: 'fire', name: 'Fire Brigade', detail: 'Ballygunge Fire Station', distanceM: 400, lat: 22.5240, lng: 88.3650 },
]

export const categories: CategoryDef[] = [
  { id: 'c-pandals', label: 'Pandals', labelBn: 'প্যান্ডেল', icon: 'pandal', group: 'places', route: '/explore' },
  { id: 'c-restaurants', label: 'Restaurants', labelBn: 'রেস্টুরেন্ট', icon: 'restaurant', group: 'places', route: '/search?type=restaurant' },
  { id: 'c-places', label: 'Places', labelBn: 'জায়গা', icon: 'place', group: 'places', route: '/search?type=place' },
  { id: 'c-metro', label: 'Metro', labelBn: 'মেট্রো', icon: 'metro', group: 'transport', route: '/search?q=metro' },
  { id: 'c-bus', label: 'Bus', labelBn: 'বাস', icon: 'bus', group: 'transport', route: '/search?q=bus' },
  { id: 'c-parking', label: 'Parking', labelBn: 'পার্কিং', icon: 'parking', group: 'transport', route: '/search?q=parking' },
  { id: 'c-police', label: 'Police Station', labelBn: 'পুলিশ স্টেশন', icon: 'police', group: 'utilities', route: '/safety' },
  { id: 'c-hospital', label: 'Hospital', labelBn: 'হাসপাতাল', icon: 'hospital', group: 'utilities', route: '/safety' },
  { id: 'c-atm', label: 'ATM', labelBn: 'এটিএম', icon: 'atm', group: 'utilities', route: '/search?q=atm' },
  { id: 'c-pharmacy', label: 'Pharmacy', labelBn: 'ফার্মেসি', icon: 'pharmacy', group: 'utilities', route: '/search?q=pharmacy' },
  { id: 'c-toilet', label: 'Toilet', labelBn: 'টয়লেট', icon: 'toilet', group: 'utilities', route: '/search?q=toilet' },
  { id: 'c-helpdesk', label: 'Help Desk', labelBn: 'হেল্প ডেস্ক', icon: 'help', group: 'utilities', route: '/safety' },
]

export const interests = ['Photography', 'Pandal hopping', 'Food', 'Music', 'Art', 'Night exploration', 'Heritage', 'Family-friendly']

/** Real (AI-generated, illustrative) photography mapped onto the demo entities.
   Injected into each palette so every <Img> renders the photo over the gradient. */
const PHOTOS: Record<string, string> = {
  'pandal-santosh-mitra': '/img/pandal-grand.jpg',
  'pandal-kalyani-iti': '/img/pandal-terracotta.jpg',
  'pandal-baghbazar': '/img/pandal-traditional.jpg',
  'pandal-deshapriya': '/img/pandal-tower.jpg',
  'pandal-ekdalia': '/img/pandal-heritage.jpg',
  'pandal-mudiali': '/img/pandal-art.jpg',
  'pandal-suruchi': '/img/pandal-sculpture.jpg',
  'pandal-tridhara': '/img/pandal-neon.jpg',
  'rest-oh-calcutta': '/img/food-thali.jpg',
  'rest-6-ballygunge': '/img/food-bengali.jpg',
  'rest-kasturi': '/img/food-breakfast.jpg',
  'rest-aromas': '/img/food-multi.jpg',
  'rest-urshta': '/img/food-fine.jpg',
  'rest-mithai': '/img/food-sweets.jpg',
  e1: '/img/pandal-traditional.jpg',
  e2: '/img/pandal-sculpture.jpg',
  e3: '/img/pandal-neon.jpg',
  e4: '/img/event-kumartuli.jpg',
}
for (const pl of places) if (PHOTOS[pl.id]) pl.palette = { ...pl.palette, img: PHOTOS[pl.id] }
for (const ev of events) if (PHOTOS[ev.id]) ev.palette = { ...ev.palette, img: PHOTOS[ev.id] }

/** Approximate user position for demo distance rendering (Ballygunge, Kolkata). */
export const DEMO_USER = { lat: 22.527, lng: 88.359 }
