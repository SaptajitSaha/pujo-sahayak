<div align="center">

<img src="public/favicon.svg" width="88" alt="Pujo Sahayak logo" />

# Pujo Sahayak · পূজা সহায়ক

**Your companion for Durga Puja in Kolkata — pandals, food, routes, safety and a
guiding light, all in your pocket.**

A mobile-first, installable **PWA** built with React + Vite. Offline-friendly,
trilingual, and grounded in *real* Kolkata pandals and restaurants.

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=1a1a1a)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=1a1a1a)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-installable-5b0fad)](https://vite-pwa-org.netlify.app)

</div>

---

<table align="center">
  <tr>
    <td align="center"><img src="assets/screens/phone-home.png" width="248" alt="Home" /></td>
    <td align="center"><img src="assets/screens/phone-explore.png" width="248" alt="Explore" /></td>
    <td align="center"><img src="assets/screens/phone-pandal.png" width="248" alt="Pandal detail" /></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Home</b> — nearby spotlight & rails</sub></td>
    <td align="center"><sub><b>Explore</b> — filter, list & map</sub></td>
    <td align="center"><sub><b>Pandal</b> — theme, crowd, metro</sub></td>
  </tr>
</table>

---

## ✨ What it does

- **Pandal & restaurant discovery** — curated, real Kolkata spots with themes,
  live crowd levels, ratings, distances and nearest metro stations.
- **Maya, your guide-light** — an in-app assistant for "which pandal should I
  not miss?", food recs and day-by-day planning.
- **Trip planner & route maps** — build an itinerary across the days of Puja and
  see it on an interactive map.
- **Day-of weather** — real Open-Meteo forecasts (no key, no tracking) on the
  planner and the tithi timeline; cached for offline and clearly flagged when
  stale — never a fabricated forecast.
- **Pandal-hopping scorecard** — GPS-verified on-site check-ins build your
  streak, badges and pandals-seen, all computed on your device. No location,
  no check-in.
- **Best Time To Visit & Pandal Pulse** — a modelled hour-by-hour crowd window
  and freshness/provenance labels ("Official · 8 min ago" / "Visitor estimate" /
  "modelled — illustrative") so you always know how much to trust a number.
- **Tonight & "What should I do next?"** — a time-aware evening dashboard and a
  top-3 next-step engine scored from your real plan, saves and distances.
- **Save with intent · Story mode · History · Look Closer · Photo guide ·
  Accessibility** — richer pandal pages, every derived surface honestly labelled.
- **Safety Circle & Smart Meeting Point** — a local circle of up to 5 trusted
  contacts with tap-to-share (no live tracking) and a suggested meeting point
  built from real known spots.
- **Season & memory layer** — Puja Mode countdown, a GPS-earned **Puja Passport**
  (`/passport`), a private on-device **Puja Diary** (`/diary`), live **Personal
  Statistics** and an **AI-free Puja Recap**, all computed from your own activity.
- **Festival notices & info reports** — a Home digest of official notices with an
  "applies to" line, and a "report incorrect info" queue kept on-device until a
  backend is connected.
- **Meetups** — create and join plans so no one wanders the crowds alone.
- **Safety** — a dedicated hub with a missing-person flow and help-desk / medical
  camp info surfaced on every pandal card.
- **Real location, honestly handled** — device geolocation with Nominatim
  reverse-geocoding for addresses; graceful coordinate-only fallback when
  offline or permission is denied. It never invents an address.
- **Trilingual chrome** — English · বাংলা · हिन्दी, plus light/dark themes.
- **Installable & offline-friendly** — service worker, app shell, and a
  reduced-motion mode that respects your system preference.

## 📱 Screens

<table>
  <tr>
    <td align="center"><img src="assets/screens/phone-planner.png" width="200" alt="Planner" /><br /><sub><b>Planner</b></sub></td>
    <td align="center"><img src="assets/screens/phone-favorites.png" width="200" alt="Favorites" /><br /><sub><b>Favorites</b></sub></td>
    <td align="center"><img src="assets/screens/phone-meets.png" width="200" alt="Meetups" /><br /><sub><b>Meetups</b></sub></td>
    <td align="center"><img src="assets/screens/phone-location.png" width="200" alt="Location" /><br /><sub><b>Location picker</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/screens/phone-categories.png" width="200" alt="Categories" /><br /><sub><b>Categories</b></sub></td>
    <td align="center"><img src="assets/screens/phone-notifications.png" width="200" alt="Notifications" /><br /><sub><b>Notifications</b></sub></td>
    <td colspan="2" align="center" valign="middle"><sub>…and more: <b>Maya</b> assistant, <b>Trip map</b>,
    <b>Safety</b>, <b>Missing person</b>, <b>Settings</b>, <b>Beyond Puja</b>.</sub></td>
  </tr>
</table>

## 🧱 Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build / dev | Vite 6 (code-split routes, lazy loading) |
| Styling | Tailwind CSS v4 (`@theme` design tokens) |
| State | Zustand 5 with `persist` (versioned migrations) |
| Motion | Framer Motion 11 (scroll reveals, fluid gradients) |
| Maps | Leaflet + OpenStreetMap · optional Google Maps (key-gated) |
| Icons | lucide-react |
| Delivery | `vite-plugin-pwa` — installable, offline app shell |
| Geocoding | Browser Geolocation + Nominatim (OSM) reverse geocode |

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Production build + local preview
npm run build
npm run preview
```

Then open the printed local URL (mobile viewport recommended) — or run a Lighthouse
audit to see the PWA score.

### Optional: Google Maps for the pin picker

By default the drop-a-pin address picker uses the free **Leaflet + OpenStreetMap**
tiles — no key, no billing, works out of the box. If you have a Google Maps key and
prefer it for that one screen, add a `.env.local`:

```bash
# .env.local  (never committed — see .env.example)
VITE_GOOGLE_MAPS_KEY=your_key_here
```

The app automatically switches the pin picker to Google Maps when the key is
present, and falls back to OSM when it isn't. Trip/Explore maps always stay on
Leaflet.

## 🌿 Design notes

- **Ambient background** — two full-height gradient blobs drift on mirrored
  vertical sweeps behind a glassmorphic UI.
- **Fluid brand gradient** — a purple → pink → blue ramp animates across the
  active nav pill and primary CTAs.
- **Motion with a brake** — every scroll reveal, count-up and rail honours
  `prefers-reduced-motion` (and an in-app toggle), rendering content instantly.

## 🔌 Backend integration (optional)

Five community features — **Live Notes**, **Social Matching**, **Marketplace**,
**Wallet / Payments** and **Authority Integration** — are built on **Supabase**
(Postgres + Auth + Realtime + Edge Functions). The whole app still runs with **no
backend at all**: every service falls back to clearly-labelled demo data (or an
honest empty state) when Supabase is unconfigured, and nothing is ever fabricated
as live.

```bash
# .env.local — leave unset to stay in the local/demo mode
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- **Schema & RLS**: apply `supabase/migrations/001_initial_schema.sql`. Tables
  start **empty**; Row Level Security lets anonymous users read published content
  while writes require a signed-in session.
- **Auth**: email magic-link via Supabase Auth. Browsing is public and works
  signed-out; posting a note, saving preferences or ordering requires sign-in.
- **Realtime**: `live_notes`, `official_notices` and `authority_alerts` are in the
  realtime publication; sections subscribe passively (no always-on animation) and
  stay readable offline via the query cache.
- **Trust hierarchy, visibly enforced**: *Official* content renders with a gold
  accent + shield; *Visitor* notes with a muted border + "Visitor" chip — so a
  community observation is never mistaken for an authority notice.
- **Auto-expiry & moderation**: `supabase/functions/expire-notes` retires stale
  notes and auto-rejects over-reported ones; rate-limits posting.

### Feature flags

Every new surface is gated in `src/config/features.ts` (compile-time env defaults
plus a runtime override under **Settings → Developer**). Turning a flag off hides
its UI and blocks its route. Set any of `VITE_FLAG_LIVE_NOTES`, `VITE_FLAG_SOCIAL`,
`VITE_FLAG_MARKETPLACE`, `VITE_FLAG_WALLET`, `VITE_FLAG_AUTHORITY` to `false`/`true`.

The **Second Product Extension** adds eighteen more flags (`ENABLE_BEST_TIME`,
`ENABLE_TONIGHT`, `ENABLE_WHAT_NEXT`, `ENABLE_SAVE_INTENT`, `ENABLE_SAFETY_CIRCLE`,
`ENABLE_SMART_MEETING`, `ENABLE_STORY_MODE`, `ENABLE_LOOK_CLOSER`,
`ENABLE_PANDAL_HISTORY`, `ENABLE_ACCESSIBILITY`, `ENABLE_PHOTO_GUIDE`,
`ENABLE_PUJA_MODE`, `ENABLE_PUJA_PASSPORT`, `ENABLE_PUJA_DIARY`, `ENABLE_PUJA_STATS`,
`ENABLE_PUJA_RECAP`, `ENABLE_FESTIVAL_NOTICES`, `ENABLE_INFO_REPORTS`) — on by
default in the demo build, each overridable with `VITE_FLAG_<NAME>=false`.

### Payment provider swap

Payments go through a single `PaymentService` abstraction (`src/services/payment.ts`).
Today it is backed by `MockPaymentAdapter` (`src/services/payment.mock.ts`) which
**never moves real money** — every transaction is tagged `demo_completed` /
`is_demo` and the UI shows a "DEMO — no real payment processed" banner. To go live,
implement `PaymentService` with a real gateway (e.g. Razorpay), tokenize cards on
the provider side (raw card data is never stored), and return the new adapter from
`getPaymentService()`. No UI or order flow needs to change.

## 📜 License

Private project — all rights reserved.
