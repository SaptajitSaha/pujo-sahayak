# Task List: Pujo Sahayak Build

Track progress here. Each task leaves the app in a runnable state.

## Phase 1 — Foundation

- [ ] **T1: Scaffold Vite + React + TS PWA**
  `npm create vite` app, Tailwind v4, React Router, Zustand, Framer Motion, vite-plugin-pwa (manifest, icons, offline shell). Verify: `npm run build` clean; dev server serves app shell. Depends: None. Scope: S

- [ ] **T2: Design system + shared components**
  Tokens (ivory/vermilion/charcoal/gold/indigo, radii, type scale w/ Bengali serif accent), `Button`, `Chip`, `Card` (place-card variant), `SectionHeader`, `BottomNav` (5 tabs + active state), `AppShell`, `Waveform`, `ScanFrame`, page-transition wrapper w/ reduced-motion support. Verify: storybook-free demo route renders every component. Depends: T1. Scope: M

- [ ] **T3: Data model + Kolkata demo dataset**
  Types: Place/Pandal/Restaurant/Event/Meetup/Review/Photo/PlanDay/Offer/SafetyPoint/Category. Dataset: ≥8 real pandals (Santosh Mitra Square, Kalyani ITI, Baghbaz Sarbojanin, Deshapriya Park, Ekdalia Evergreen…), ≥6 restaurants (Oh! Calcutta, 6 Ballygunge Place…), events, meetups, offers, safety points w/ lat-lng; `isDemo: true`. Verify: TS compiles; dataset loads in store. Depends: T1. Scope: M

## Checkpoint: Foundation — build clean, shell + nav + tokens visible. Review with human.

## Phase 2 — Discovery core

- [ ] **T4: Splash screen**
  Full-bleed dark Durga-atar-ti image/gradient, wordmark + tagline "See the Puja. Understand the story.", auto-advance to Home. Verify: renders at `/splash`, transitions. Depends: T2, T3. Scope: S

- [ ] **T5: Home page**
  "শুভ শারদীয়া" greeting + Kolkata·2026, search bar (→ /search), বাংলা/English/Hindi toggle, Sponsored card, Explore Spotlight, Nearby Restaurants rail, Offers & Discounts rail, Events rail, Continue Where You Left Off (store-backed). Order per doc §52. Verify: all sections render from dataset; language toggle switches strings. Depends: T2, T3, T4. Scope: L → done as one screen w/ section components

- [ ] **T6: Explore / Pandal Directory**
  List/Map toggle (Leaflet markers), filter chips (Area/Distance/Theme/Crowd), pandal cards w/ rating·distance·crowd tag·theme, View Details/Route actions. Verify: filters actually filter dataset; map shows markers. Depends: T2, T3. Scope: M

- [ ] **T7: Pandal Detail**
  Hero image + name/location/save, rating·reviews·distance·crowd·open-till, action row (Save/Visited/Route), info row (Location/Metro/Facilities/Safety), About + theme story, "Ask Maya about this pandal" chip (→ /maya with context), What Others Say (demo reviews), Top Clicks + Post Your Photos (local sim verification), Similar Places, Nearby Restaurants, Meetups near this place. Verify: all sections present, Save/Visited persist. Depends: T2–T6. Scope: L → split sub-sections if needed

## Checkpoint: Discovery core — Home→Explore→Detail flow works end-to-end. Review with human.

## Phase 3 — Maya + Search/Categories

- [ ] **T8: Maya chat**
  Header w/ avatar + Online, message thread, Bengali user bubble + Maya reply w/ inline audio-player row + waveform, quick-reply chips (Nearest Metro? / Medical Camp? / More about the artist), context-aware via route state, grounded dataset retrieval + "I don't have verified information" fallback, FAB mic toggling voice-input mode. Verify: asking about current pandal returns dataset facts. Depends: T7. Scope: M

- [ ] **T9: Maya Scan & Identify**
  Live getUserMedia camera preview, animated scan frame, Gallery/Flash controls, "Point your camera at a pandal", capture → simulated matching against dataset (honest demo result card) → pandal detail. Verify: camera opens w/ permission; result navigates. Depends: T8. Scope: M

- [ ] **T10: Search + Categories**
  Search: pills (All/Pandals/Restaurants/Events), live filter of dataset, Trending Pandals rail, Popular Nearby Places rail. Categories: Places / Transport & Services / Utilities icon grids per mockup, purple "Ask Maya" CTA. Verify: both routes reachable from nav; searches return results. Depends: T3, T6. Scope: M

## Phase 4 — Planning & social

- [ ] **T11: Favorites**
  Saved Pandals, Places You've Been, You Might Like (simple similarity: same area/theme), Puja Planner entry card. Verify: reflects store state live. Depends: T7. Scope: S

- [ ] **T12: Puja Planner**
  Day tabs Panchami→Dashami, stop cards (image, type, duration, travel-between rows), + Add Place (picker from dataset/saved), Optimize with AI (nearest-neighbor reordering, "suggestions" wording), Start Navigation → /trip/:day. Verify: plan persists across reload. Depends: T11. Scope: M

- [ ] **T13: Meets + Create Meetup**
  Meets: All/Nearby/My Interests pills, meetup cards (image, name, date·time, location·distance, attendee avatars + count, Join). Create: title/date/time/location/description/interest chips/max participants/public-restricted → adds to list locally. Verify: join/create update state. Depends: T3. Scope: M

## Checkpoint: Planning & social — plan a day, join a meetup. Review with human.

## Phase 5 — Utility & account

- [ ] **T14: Restaurant Detail**
  Hero, rating/reviews/distance/Open now/cuisine·price, Save/Call(stub)/Order(disabled "coming soon"), Popular Dishes rail. Verify: reachable from every restaurant card. Depends: T3, T5. Scope: S

- [ ] **T15: Trip / Route Map**
  Leaflet map w/ day's stops as numbered markers + polyline, stop list w/ times, total distance + estimated time (haversine), Start Navigation. Verify: renders from planner day. Depends: T12. Scope: M

- [ ] **T16: Profile + Settings + Safety + Missing Person**
  Profile: header w/ Premium badge, stats (visits/saved/meets), Upgrade banner, Emergency Shortcuts row, list rows (Visits, Payments & Subs, Donations, Appearance, Settings). Settings: per mockup incl. App Logo picker. Safety: red-gradient screen, Call 112 (tel:), Nearby Help Points from dataset, I am lost / Report Missing Person → 4-step wizard (Person→Details→Location→Submit, local record only). Verify: all rows navigate; wizard completes. Depends: T2, T3. Scope: L → split if needed

## Phase 6 — Polish

- [ ] **T17: Personalization + i18n + theme**
  Dark mode, reduced motion, full বাংলা/English string coverage, app-logo variants. Verify: toggles apply instantly + persist. Depends: T5–T16. Scope: M

- [ ] **T18: Beyond Puja + PWA + responsive audit**
  "Explore Kolkata Beyond Puja" card/section, offline PWA audit (install prompt, shell cache), desktop adaptation (max-width app frame + multi-column rails), final motion pass. Verify: Lighthouse PWA installable; layout verified at 375px + 1280px. Depends: T17. Scope: M

## Checkpoint: Complete
- [ ] Build clean, all routes navigable, persistence verified
- [ ] Screen-by-screen comparison against mockups
- [ ] Ready for review
