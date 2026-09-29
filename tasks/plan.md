# Implementation Plan: Pujo Sahayak (React + Vite PWA)

## Overview

Build Pujo Sahayak as a mobile-first React + Vite PWA replicating all 21 mockup screens — improved in polish per context-doc §50 — covering: Splash, Home, Explore/Pandal Directory, Pandal Detail, Maya (chat/scan/voice UI), Puja Planner, Meets, Categories, Search, Profile, Safety/Emergency, Missing Person Report, Trip/Route Map, Restaurant Detail, Create Meetup, Settings, and the off-season "Beyond Puja" experience. Data is a typed local demo dataset grounded in real Kolkata pandals/restaurants; all user state (saves, visits, plans, settings) persists to localStorage.

## Architecture Decisions

- **React 18 + TypeScript + Vite** — user-selected stack; `vite-plugin-pwa` for manifest + service worker (installable, offline shell).
- **Tailwind CSS v4** — the mockups' design system (ivory surfaces, vermilion primary, charcoal ink, muted gold, dark imagery) is encoded as design tokens in CSS; no component library so the UI stays bespoke, not "generic SaaS".
- **React Router v6** — 5-tab bottom nav maps to routes; detail pages are nested routes (`/pandal/:id`, `/restaurant/:id`).
- **Zustand + persist middleware** — one client store: saved places, visited places, puja plan (6 day-slots), meetups, language, theme, app-logo choice, "continue where you left off" session.
- **Framer Motion** — the motion system from doc §49: soft page fades, subtle card scale, animated scan frame, voice waveform. Honors reduced-motion setting.
- **Leaflet + OpenStreetMap tiles** — real maps for route map, List/Map toggle, nearby help points. No Google Maps key needed.
- **Maya is UI-complete, AI-simulated locally** — chat/voice/camera shell exactly like mockups; answers are retrieved from the local dataset (grounded, never hallucinated, per doc §42); camera uses real `getUserMedia` preview with scan-frame animation; identification is simulated against the dataset with an honest "demo" marker. No fake integrations presented as production (§58).
- **Images**: curated local placeholder gradients + free stock where possible at build time; layout is image-agnostic so real photography drops in later. Every mockup-only typo label is interpreted by intent (Srofile→Profile, Evetits→Events, Popoort Vbbosa→Report UB/Persona, Sccenery→Scenery).
- **Demo-data honesty**: `isDemo: true` on the dataset; crowd levels and hours rendered only from dataset fields.

## Screen → Route Map

| Mockup screen | Route |
|---|---|
| Splash | `/splash` (entry) |
| Home | `/` |
| Explore / Pandal Directory | `/explore` |
| Pandal Detail | `/pandal/:id` |
| Maya chat / Scan / Voice | `/maya`, `/maya/scan` |
| Puja Planner | `/planner` (also under Favorites) |
| Meets list | `/meets` |
| Create Meetup | `/meets/create` |
| Categories | `/categories` |
| Search | `/search` |
| Profile | `/profile` |
| Safety / Emergency | `/safety` |
| Missing Person Report | `/safety/missing-person` |
| Trip / Route Map | `/trip/:planDayId` |
| Restaurant Detail | `/restaurant/:id` |
| Settings | `/profile/settings` |
| Beyond Puja | `/beyond-puja` (from Home Events section) |

## Task Breakdown

See `tasks/todo.md` for the checklist. Summary:

### Phase 1 — Foundation (T1–T3)
Scaffold + PWA, design system + shared components (cards, chips, buttons, bottom nav, section headers, motion primitives), typed data model (User/Place/Pandal/Restaurant/Event/Meetup/Review/Photo/Plan/Offer/SafetyPoint) + Kolkata demo dataset.

### Phase 2 — Discovery core (T4–T7)
Splash; Home (greeting, language toggle, sponsored, spotlight, restaurants, offers, events, continue-where-left-off); Explore with List/Map + filters; Pandal Detail (hero, actions, about, Ask-Maya chip, reviews, top clicks, similar, nearby).

### Phase 3 — Maya + Search/Categories (T8–T10)
Maya chat shell with dataset-grounded responses + voice waveform UI; Maya camera scan with getUserMedia + animated frame; Search (trending, nearby, filter pills) and Categories (Places / Transport & Services / Utilities).

### Phase 4 — Planning & social (T11–T13)
Favorites (saved / visited / you-might-like); Puja Planner (day tabs, stops, add place, Optimize-with-AI nearest-neighbor suggestion); Meets list + Create Meetup.

### Phase 5 — Utility & account (T14–T16)
Restaurant Detail; Trip/Route Map (Leaflet, multi-stop); Profile + Settings + Safety/Emergency + Missing Person wizard.

### Phase 6 — Polish (T17–T18)
Personalization (dark mode, reduced motion, app-logo picker, Bengali/English i18n strings), "Beyond Puja" off-season card, PWA offline audit, motion pass, responsive desktop adaptation.

## Verification (project-wide)

- `npm run build` clean, no TS errors
- Dev server: every route reachable via bottom nav or documented deep link
- Saves/visits/plan/settings survive reload (localStorage)
- Manual check against mockups: per-screen IA matches (elements present, order per doc §52)
- No fabricated stats/reviews beyond the clearly-demo dataset; Maya never invents facts

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope is 21 screens — agent fatigue/context loss | High | Vertical slices, each task leaves app runnable; todo.md survives sessions |
| Mockup fidelity vs "even more improved" tension | Med | IA locked to mockups; visual polish guided by tokens; review screenshots per checkpoint |
| Maya "AI" expectations | Med | Explicitly local retrieval demo; architecture keeps a clean swap-in point for a real LLM API |
| Offline image availability | Low | Gradient/placeholder fallbacks; layout never breaks without images |
| Bengali text rendering | Low | Google Fonts (Noto Serif Bengali / Hind Sildar) with system fallback |

## Open Questions (defaults chosen; flag if wrong)

1. Reviews/photos on Pandal Detail: demo entries from the dataset (marked demo) — no upload backend in v1; photo upload flow simulates verification locally.
2. Premium/payments: UI present (Upgrade banner, donation entries) but non-functional stubs — no payment integration in v1.
3. Auth: skipped in v1 (profile is local-only) — phoneOTP UI can come later.
