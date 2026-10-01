# Task List: Tier 1 Feature Enhancements

v1 build tasks T1–T18: all shipped (see git history + README). This list tracks the
Tier 1 expansion. Each task leaves the app runnable.

## Feature 1 — Pandal-Hopping Scorecard & Streaks  ✅ committed b9386ff

- [x] **F1-A: scorecard pure logic, test-first**
  `src/lib/scorecard.ts` (Checkin, withinGeofence w/ accuracy widening, tithiForDate,
  longestStreak, scorecardSummary, BADGES + evaluateBadges) + `scorecard.test.ts`
  written red-first. vitest dev-dep + `npm test`. 15/15 green.

- [x] **F1-B: store v3 + PandalDetail GPS check-in**
  `checkins` slice, idempotent addCheckin, version 2→3 additive migration; Check-in
  button with locating/ok/far/denied states, gated by real GPS. `getCurrentLocationPrecise`.

- [x] **F1-C: Profile Scorecard panel**
  Stats (pandals, tithis, best streak) + earned/locked badge grid + text share; clean 0-state.

### Checkpoint: Feature 1  ✅
- [x] `npm test` + `npm run build` green; browser flow verified (off-site GPS → honest
  "not at this pandal yet", checkins stayed [], no console errors); committed atomically.

## Feature 2 — Day-of Weather Layer

- [x] **F2-A: weather service, test-first**
  `src/lib/weather.ts`: fetchDayWeather (Open-Meteo, no key), localStorage cache (6 h
  TTL, stale-on-offline), weatherVerdict. 10/10 tests green (injectable fetch/KV).

- [x] **F2-B: chips in Planner + Tithi**
  `useDayWeather` + `DayWeatherChip`; strip under Planner day tabs; chip on the six
  planning-day Tithi cards (Pratipada date-mismatch suppressed); fixed-height row (CLS).
  Browser: live 200s, correct verdicts/colors, zero console errors.

### Checkpoint: Feature 2 / Tier 1 complete  ✅
- [x] Tests (25/25) + build green; CLS-safe chip row; no new always-on animation (FPS
  budget intact); README feature list updated; committed; **awaiting user confirmation
  for Tier 2 (Voice mode, phonetic search, lost-child safety kit).**

---

# Task List: Second Product Extension (20 features, 5 phases)

> Built by extending existing surfaces behind 18 new feature flags, local-first,
> anti-fabrication labels throughout. Suite grew 106 → 117 tests; every phase
> `npm run build` + `npx vitest run` green before one atomic commit.

## Phase 0 — Foundation  ✅ committed d31007b
- [x] Dark-theme `index.css` fix (own atomic commit f16a7fd).
- [x] 18 feature flags + env overrides + Settings→Developer listing.
- [x] Types: `SaveIntent`, `DiaryEntry`, `Place.accessibility?`, report target types.
- [x] Store v5: `saveIntents`, `diary` slices + actions, migrate defaults.
- [x] i18n keys (en+bn+hi) for all later phases in one pass.

## Phase 1 — Contextual outing layer  ✅ committed f2f3275
- [x] 1a Best Time To Visit — `bestTime.ts` TDD + PandalDetail + Home chip.
- [x] 1b Pandal Pulse freshness/provenance rows; `pulse.test.ts` updated.
- [x] 1c Tonight Dashboard on Home (composition of existing slices).
- [x] 1d What Should I Do Next? — `whatsnext.ts` TDD + Home bottom sheet.
- [x] 1e Save With Intent — chip sheet, badge on Favorites, consumed by 1c/1d.

## Phase 2 — Safety & meeting  ✅ committed 3c1b00f
- [x] 2a Safety Circle — up to 5 contacts, tap-to-share, SOS to whole circle.
- [x] 2b Smart Meeting Point — centroid over real known spots, explicit suggest.

## Phase 3 — Story, camera, knowledge  ✅ committed 77912ba
- [x] 3a Pandal History Timeline; 3b Story Mode (+ read-aloud); 3c Look Closer
  honest-unknown; 3d Accessibility (illustrative); 3e Photo Guide.

## Phase 4 — Season & memory layer  ✅ committed b48fe7a
- [x] 4a Puja Mode strip (countdown + passport progress, demo-honest).
- [x] 4b Puja Passport `/passport` — GPS-check-in stamps only.
- [x] 4c Puja Diary `/diary` — private on-device CRUD.
- [x] 4d Personal Statistics — `pujastats.ts` TDD.
- [x] 4e AI-free Puja Recap — deterministic template, honest empty state.

## Phase 5 — Notices, reports, Maya glue  ✅ committed a44ecfc
- [x] 5a Festival notices surfaced per-pandal (`OfficialNotices`, expired state).
- [x] 5b Report incorrect info (`place_info`) + per-note report flag.
- [x] 5c Maya `UserActivity` intents — brain/askMaya/buildContext; `brain.test.ts`.

### Checkpoint: Extension complete  ✅
- [x] 117 tests + build green; each surface ships empty/loading/error/offline
  variants; flag-off hides UI + blocks route; README / plan.md / Master Context
  updated (no new bloat files); Docs committed atomically.
