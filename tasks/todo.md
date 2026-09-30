# Task List: Tier 1 Feature Enhancements

v1 build tasks T1–T18: all shipped (see git history + README). This list tracks the
Tier 1 expansion. Each task leaves the app runnable.

## Feature 1 — Pandal-Hopping Scorecard & Streaks

- [ ] **F1-A: scorecard pure logic, test-first**
  `src/lib/scorecard.ts` (Checkin, withinGeofence w/ accuracy widening, tithiForDate,
  longestStreak, BADGES + evaluateBadges) + `scorecard.test.ts` written first (red →
  green). vitest dev-dep + `npm test` script. Verify: `npm test` green; `tsc -b` clean.
  Depends: None. Scope: S

- [ ] **F1-B: store v3 + PandalDetail GPS check-in**
  `checkins` slice, addCheckin, version 2→3 additive migration; Check-in button in the
  action row with locating/success/too-far/denied states; no same-pandal-same-tithi dupes.
  Verify: v2 payload migrates; reload persists check-in; denial path honest.
  Depends: F1-A. Scope: M

- [ ] **F1-C: Profile Scorecard panel**
  Stats (pandals, tithis, best streak) + badge grid (earned/locked) + text share.
  Verify: 0-state renders cleanly; earned badges match evaluateBadges; browser check.
  Depends: F1-B. Scope: M

### Checkpoint: Feature 1
- [ ] `npm test` + `npm run build` green; browser flow verified; commit(s) atomic.

## Feature 2 — Day-of Weather Layer

- [ ] **F2-A: weather service, test-first**
  `src/lib/weather.ts`: fetchDayWeather (Open-Meteo, no key), localStorage cache
  (6 h TTL, stale-on-offline), weatherVerdict thresholds. Tests with mocked fetch
  written first. Verify: `npm test` green. Depends: None (parallel-safe with F1). Scope: S

- [ ] **F2-B: chips in Planner + Tithi**
  `useDayWeather(day)` hook; verdict chip strip under Planner day tabs; chip on Tithi
  cards with a planDay; offline line; height reserved (CLS ≤ 0.1). Verify: live fetch in
  preview; offline fallback; console clean. Depends: F2-A. Scope: M

### Checkpoint: Feature 2 / Tier 1 complete
- [ ] Tests + build green; performance budgets spot-checked (INP on check-in tap, CLS on
  chip row); README feature list updated; committed; await user confirmation for Tier 2.
