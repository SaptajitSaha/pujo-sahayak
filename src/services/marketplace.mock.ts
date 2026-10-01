// ─── Marketplace demo data ───────────────────────────────────────────────────
// Grounded in the real puja-commerce categories the app already surfaces
// (sarees, jewellery, puja essentials, handmade, experiences, partner offers).
// Every row is tagged is_demo:true so the UI can label it honestly — these are
// illustrative sellers/products for development, NOT a live catalog.

import type { MarketplaceProduct } from '../data/types'

const now = new Date().toISOString()

export const DEMO_PRODUCTS: MarketplaceProduct[] = [
  { id: 'mp1', seller_id: null, name: 'Handloom Tant Pujo Saree', category: 'clothing', price: 1899, description: 'Breathable handwoven cotton tant, pre-dyed in puja red-and-white.', images: [], availability: 'in_stock', area: 'Gariahat', partner_status: 'verified', is_demo: true, created_at: now },
  { id: 'mp2', seller_id: null, name: 'Dhuti-Kurta Set (Handwoven)', category: 'clothing', price: 2199, description: 'Classic cotton dhuti with a kurta — the pujo-morning uniform.', images: [], availability: 'in_stock', area: 'Salt Lake', partner_status: 'independent', is_demo: true, created_at: now },
  { id: 'mp3', seller_id: null, name: 'Shakha-Pola Conch & Coral Set', category: 'accessories', price: 899, description: 'Traditional conch bangles and coral set for married women.', images: [], availability: 'limited', area: 'Bara Bazaar', partner_status: 'independent', is_demo: true, created_at: now },
  { id: 'mp4', seller_id: null, name: 'Brass Pujo Thali (7-piece)', category: 'puja_essentials', price: 1249, description: 'Hammered brass thali set — dhuno, diyo, agarwani and more.', images: [], availability: 'in_stock', area: 'Chandni Chowk', partner_status: 'verified', is_demo: true, created_at: now },
  { id: 'mp5', seller_id: null, name: 'Dhunki & Incense Bundle', category: 'puja_essentials', price: 349, description: 'Copper dhunki with a season\u2019s supply of dhuno and agarbatti.', images: [], availability: 'in_stock', area: 'Bara Bazaar', partner_status: 'independent', is_demo: true, created_at: now },
  { id: 'mp6', seller_id: null, name: 'Hand-Painted Jute Tote', category: 'handmade', price: 549, description: 'Eco jute tote hand-painted with alpona motifs by a Kumortuli artisan.', images: [], availability: 'in_stock', area: 'Ballygunge', partner_status: 'independent', is_demo: true, created_at: now },
  { id: 'mp7', seller_id: null, name: 'Kantha Stitch Wall Hanging', category: 'handmade', price: 1599, description: 'Vintage kantha quilt re-stitched into a wall piece.', images: [], availability: 'limited', area: 'Rajarhat', partner_status: 'partner', is_demo: true, created_at: now },
  { id: 'mp8', seller_id: null, name: 'Guided Barowari Heritage Walk', category: 'experiences', price: 499, description: 'Two-hour evening walk through North Kolkata\u2019s century-old pujas with a storyteller guide.', images: [], availability: 'in_stock', area: 'North Kolkata', partner_status: 'partner', is_demo: true, created_at: now },
  { id: 'mp9', seller_id: null, name: 'Pandal Photography Mini-Session', category: 'experiences', price: 999, description: '30-minute golden-hour couple/family shoot at three lit pandals.', images: [], availability: 'limited', area: 'Maidan', partner_status: 'independent', is_demo: true, created_at: now },
  { id: 'mp10', seller_id: null, name: 'Partner Offer: 15% on Pujo Sarees', category: 'partner_offers', price: 0, description: 'Show the app at the counter for 15% off at a partner store.', images: [], availability: 'in_stock', area: 'Gariahat', partner_status: 'partner', is_demo: true, created_at: now },
]

export const MARKETPLACE_CATEGORIES: { id: MarketplaceProduct['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'puja_essentials', label: 'Puja Essentials' },
  { id: 'handmade', label: 'Handmade' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'partner_offers', label: 'Partner Offers' },
]

/** Nearest demo products to a pandal's area (falls back to a small sample). */
export function demoProductsNear(placeArea: string): MarketplaceProduct[] {
  const inArea = DEMO_PRODUCTS.filter((p) => p.area === placeArea)
  return (inArea.length ? inArea : DEMO_PRODUCTS).slice(0, 4)
}
