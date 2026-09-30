# Implementation Plan: Tier 1 Feature Enhancements (v2 expansion)

> Prior plan "Pujo Sahayak v1 build" (T1–T18) is **complete and shipped** — every screen
> listed in it exists in `src/pages` and the APK builds in CI. This file now tracks the
> Tier 1 expansion agreed on 2026-09-30.

## Overview

Two features, built as thin vertical slices with TDD on all pure logic:

1. **Pandal-Hopping Scorecard & Streaks** — GPS-verified check-ins on PandalDetail,
   persisted in the Zustand store, surfaced as a Scorecard (stats, badges, streak) in
   Profile. Fully offline, no fabricated data: a check-in only counts when the device's
   own location confirms presence within the pandal's geofence.
2. **Day-of Weather Layer** — real Open-Meteo daily data (no key, free, CORS) for each
   planned Puja day, shown as verdict chips on Planner and Tithi. Degrades honestly:
   offline with no cache → "weather unavailable", never invented.

Parked: "Traveling Together" (needs a real-time transport — violates the no-backend
constraint for now). Deferred within F1: canvas recap card (text share ships first).

## Global constraints (verified after every slice)

- No backend, no fake data, no fabricated stats (doc §58 convention)
- WebView FPS budget: no new always-on animations; check-in is a one-shot tap, weather
  chips are static text — zero continuous main-thread work
- Performance budgets unchanged: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 — new code paths
  lazy (weather fetched on-demand, cached; scorecard is plain DOM)
- Zustand persist: new slices require `version` bump + `migrate` defaults
- Tests: vitest (dev-dep) — pure logic is test-first; UI verified in browser via preview
- Commits: one per thin slice, atomic

## Feature 1 — Scorecard & Streaks

### F1-A: Pure logic module `src/lib/scorecard.ts` (TDD)
- `Checkin { placeId, tithi: PlanDay | null, ts, lat, lng, accuracyM }`
- `withinGeofence(user, place, accuracyM?)` — haversine ≤ max(150 m, reported GPS accuracy)
- `tithiForDate(date)` — reverse of `PLAN_DAY_DATES` (2026-10-03…08); null outside window
- `longestStreak(checkins)` — consecutive local calendar days with ≥1 check-in
- `BADGES` + `evaluateBadges(checkins, walks)`:
  - first-darshan (1 pandal) · parjatak (5 unique) · maha-parjatak (10 unique)
  - tithi-trotter (3 distinct tithis) · midnight-darshan (check-in 22:00–02:00)
  - walk-finisher (every stop of one curated walk checked in)
- Tests: `src/lib/scorecard.test.ts` — geofence boundaries incl. accuracy widening,
  tithi mapping, streak math, each badge rule. **Red before green.**

### F1-B: Store v3 + PandalDetail check-in
- Store: `checkins: Checkin[]`, `addCheckin`, version 2→3, migrate default `[]`
- PandalDetail action row gains **Check in**: tap → `getCurrentLocation()` →
  geofence gate → store append. States: idle → "Locating…" → success ("Checked in") /
  "You're not at this pandal yet" / permission-denied. Same pandal + same tithi = no
  duplicate (button shows checked state).
- Verify: browser flow with mocked/real geolocation; reload persists; migrate from v2.

### F1-C: Profile Scorecard panel
- "Your Puja Scorecard" card under stats row: pandals checked-in, tithis covered,
  best streak, badge grid (earned = gold, locked = faint w/ requirement text).
- "Share" = navigator.share text summary (clipboard fallback) — honest counts only.
- Verify: renders 0-state gracefully (no empty-section jank); CLS check.

## Feature 2 — Weather Layer

### F2-A: `src/lib/weather.ts` (TDD)
- `fetchDayWeather(dateISO)` → Open-Meteo `daily=precipitation_probability_max,
  temperature_2m_max,temperature_2m_min` for Kolkata (22.5726, 88.3639), tz Asia/Kolkata
- `DayWeather` parsed shape; localStorage cache `ps-weather-<date>` (TTL 6 h; stale
  cache served offline with `stale: true`)
- `weatherVerdict(w)` → `{ label, tone }`: rain ≥60% "Carry an umbrella" · 30–59%
  "Watch the sky" · max ≥33° "Warm afternoon" · else "Comfortable for hopping"
- Tests: mocked fetch — parse, cache hit/expiry, verdict thresholds, network-failure
  rejection with stale fallback.

### F2-B: UI wiring
- `useDayWeather(day)` hook (fetch-on-mount, cached, abort-safe)
- Planner: one-line chip strip under day tabs with date + verdict + temps
- Tithi: same chip on cards that carry a `planDay` (in-window dates only)
- Offline/no-cache: single quiet "Weather unavailable offline" line — never hidden data
  claims. Zero layout shift (chip row reserves its height).
- Verify: live network in browser preview; offline toggle test; console clean.

## Task List

See `tasks/todo.md`. Checkpoints after each feature.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mock-geolocation absent in headless browser checks | Med | Verify geofence math by unit tests; browser check exercises the real prompt/denied path |
| Open-Meteo forecast horizon (~16 days) — Oct dates out of range off-season | Low | Requests for past/out-of-range dates fail → same honest "unavailable" path; cache keeps in-season days free |
| persist migration touching real user data | Med | Additive-only v3 migration (`checkins ?? []`), same proven pattern as v2 |
| New tithi/streak date bugs | Med | Date logic fully unit-tested against fixed PLAN_DAY_DATES |

## Rejected alternatives

- Fabricated "crowd forecast" — no honest data source; revisit only from real check-in
  volume after a season.
- Canvas recap card in F1 — good, but separate deliverable; text share first, canvas later.
- SW RuntimeCaching for the weather API — own localStorage cache is simpler, one code
  path, works identically in dev.
