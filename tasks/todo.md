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
