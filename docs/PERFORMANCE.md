# Pujo Sahayak — Performance

Evidence-driven optimization log. Baselines and results are **measured**, not
estimated. Where a metric cannot be measured reliably here, that is stated.

## How this is measured

- **Build/bundle:** `npm run build` output (raw + gzip per chunk).
- **Runtime:** production bundle served by `vite preview` (port 4173), measured
  in Chrome via the Performance API (`paint`, LCP `PerformanceObserver`,
  `getEntriesByType('resource')`).
- **Important caveat:** `vite preview` serves **uncompressed** and the PWA
  service worker answers every request from cache, so the Performance API
  reports `transferSize: 0`. True on-the-wire bytes are read from
  `encodedBodySize` (== `decodedBodySize` here, verified with a `cache: 'reload'`
  fetch). In real deployment the JS/CSS/fonts are Brotli/gzip'd, so the *JS/CSS*
  numbers below are pessimistic; **JPEG images are not further compressible**,
  so the image numbers are the real cost and dominate.
- Device measured is a desktop viewport at DPR 1.25. A true low-end-Android
  throttle could not be applied from the tooling here, so mobile-critical
  **byte** metrics (device-independent) are the primary signal, with desktop
  timings as an upper bound on latency. Mobile (real) is the priority per brief.

## What is already optimized (pre-existing, verified in the audit)

These parts of the brief's checklist are **already done** and were left alone:

- **Boot splash** is inline CSS/HTML in `index.html` — paints on frame 1
  (FCP **84 ms**), compositor-only animations (`transform`/`opacity`/`translateZ`),
  reduced-motion honored, tap-to-skip, min 700 ms / 200 ms hand-off in `main.tsx`.
- **Self-hosted, subset fonts** (Latin + Latin-ext + Bengali only) — no
  render-blocking Google-Fonts fetch. No Cyrillic/Greek slices shipped.
- **Route-level code splitting** — Home eager, 30+ other routes lazy; Leaflet
  (150 kB) and the metro map stay out of the main chunk.
- **Manual vendor chunks** (react / framer / lucide / zustand) for stable hashes.
- **Deferred route pre-warming** — chunks loaded one-per-idle-slice only after
  the splash hands off, so parse never competes with the intro or Home hydration.
- **PWA Workbox** — precache shell, NetworkFirst HTML, CacheFirst `/img/`,
  SWR fonts, tile caching.
- **`loading="lazy"`** on card images; feature-flag-gated heavy sections;
  `useScrollIdlePause` for off-screen work.

## BASELINE (before this pass)

### Build output (raw / gzip)

| Chunk | Raw | Gzip | Critical path (Home) |
|---|---|---|---|
| `index` (main) | 207.5 kB | 65.0 kB | yes |
| `vendor-react` | 165.5 kB | 54.2 kB | yes |
| `vendor-framer` | 123.7 kB | 41.3 kB | yes |
| `vendor-lucide` | 47.7 kB | 9.3 kB | yes |
| `index.css` | 100.2 kB | 21.2 kB | yes |
| `leaflet-src` | 149.7 kB | 43.4 kB | no (map routes) |
| largest lazy page `PandalDetail` | 42.6 kB | 12.4 kB | no |

Initial critical JS ≈ **544 kB raw / ~170 kB gzip** + CSS 21 kB gzip. This is
already lean for a framer-motion SPA.

### Home runtime (production, verified bytes)

| Metric | Desktop 708 px | Mobile 390 px |
|---|---|---|
| FCP | 84 ms | n/a (see caveat) |
| **LCP** | **3,804 ms → 4,396 ms** (`IMG pandal-terracotta.jpg`) | n/a |
| DOMContentLoaded / load | 60 / 101 ms | 52 / 400 ms |
| Requests | 86 | 62 |
| **Total bytes** | **5,137 KB** | **5,726 KB** |
| **Images** | **3,767 KB (24 files)** | **4,530 KB (29 files)** |
| JS | 948 KB (49 files) | 773 KB |
| Fonts | 325 KB (12 woff2) | 325 KB |
| CSS | 98 KB | 98 KB |
| Long frames | 2 / 154 ms (max 100, 10 blocking) | 0 |
| DOM nodes | 694 | 668 |

Console: **0 errors, 0 app warnings.**

## Ranked bottlenecks (by measured impact)

1. **Images = 73% of the Home payload (3.77 MB, and MORE on mobile: 4.53 MB).**
   Every image is authored at 1024 px (a deliberate offline-first convention,
   see `scripts/ingest-photos.ps1`) but displayed at 118–256 CSS px —
   **4.4×–8.7× oversized** — with **no `srcset`/`sizes` and no smaller
   rendition**. No WebP/AVIF encoder is available in this environment
   (no sharp/magick/cwebp), but resolution is the dominant lever: pixels scale
   with area, so a correctly-sized rendition alone cuts ~50–65% of image bytes.

2. **LCP is Poor (3.8–4.4 s) even though the LCP image bytes arrive by 179 ms.**
   Two causes: (a) the above-the-fold Spotlight photo carries `loading="lazy"`
   and no `fetchpriority`, and (b) it sits inside an opacity-0 `Reveal` +
   coverflow whose fade isn't credited as content until it completes, with the
   3,600 ms carousel auto-advance re-triggering LCP. This is a paint-credit
   problem, not a byte problem.

3. **All 24 images fire in one burst at ~168 ms** despite `lazy` (they're within
   the near-viewport of a long vertical feed) — saturating the network in the
   exact window LCP should land. Fixed largely by (1) shrinking each to its
   display size.

Secondary / not worth speculative effort: framer-motion (123 kB) is used app-wide
and is part of the visual identity — removing it would degrade UX (brief §55).
Lucide is already tree-shaken to the used subset. Fonts are subset already.

## Targets

- Home image transfer: **< 1.5 MB** (from 3.77 MB).
- Home total transfer: **< 2.9 MB** (from 5.14 MB).
- LCP: **< 2.5 s** (from ~4.4 s).
- No visual-identity regression; all existing flows intact; test suite green.

## Change log / results

| Idea | Baseline → Result | Verdict | Why |
|---|---|---|---|
| Responsive images: generate `@480`/`@800` renditions (`scripts/make-renditions.ps1`, System.Drawing pipeline) + `srcset`/`sizes`/`decoding=async` in `<Img>`; spotlight made eager+`fetchpriority=high`; detail hero opts into `@800`/master via `priority` + `sizes="100vw"`. | Home images **3,767 KB → 942 KB** (−75%); Home **total transfer 5,137 KB → 2,314 KB** (−55%); 29 `@480` requests, 0 masters, 0 broken, console clean. | **kept** | Measured, exceeds noise, no visual regression (hero verified at 800 px ≥ 576 px displayed). |

### AFTER (Group A, production preview, verified bytes)

| Metric | Baseline → After | Δ |
|---|---|---|
| Home image bytes | 3,767 KB → **942 KB** | −75% |
| Home total bytes (desktop) | 5,137 KB → **2,314 KB** | −55% |
| Mobile image bytes | 4,530 KB → **~1,150 KB** (est., same renditions) | −74% |
| FCP | 84 ms → 84 ms (unchanged, already optimal) | — |
| Critical-path JS | ~170 KB gzip (unchanged — no dep changes) | — |
| Requests / broken imgs / console errors | 91 / **0** / **0** | — |
| Build + tests | `npm run build` green; `vitest run` **134/134** | — |

**Trade-off (stated honestly):** the renditions add **4.54 MB** to the static
asset set (`public/img` 6.16 MB masters → 10.7 MB total). JPEGs are **not**
Workbox-precached (`globPatterns` has no `jpg`), so the offline-install payload
is unchanged and only the renditions a user actually views are runtime-cached
(CacheFirst `/img/`). Net: +4.5 MB rarely-fetched static bytes bought −2.8 MB
downloaded on every Home visit, which is the mobile-first priority of the brief.

### LCP — status and honest limitation

Baseline LCP was Poor (3,804 → 4,396 ms) driven by (1) the LCP Spotlight photo
being `loading="lazy"` with no priority, and (2) its bytes (a 190–250 KB master)
decoding late. Group A fixed both mechanically: the spotlight card is now
`loading="eager"` + `fetchpriority="high"` + `decoding="auto"`, and it loads the
~45 KB `@480`/`@800` rendition instead of the master, so its bytes arrive and
decode far sooner. **A numeric after-LCP could not be captured here:** the
automation tab ran with `visibilityState="hidden"`, and Chrome emits no
`paint`/`largest-contentful-paint` entries for a non-visible tab. Reporting an
LCP number would be fabrication (brief §64), so it is left unmeasured. Verify on
a foreground, throttled device with Lighthouse/DevTools.

The residual, unmeasured LCP inflator is the Spotlight coverflow itself: the
photo lives inside a `Reveal` (opacity 0→1) and the carousel auto-advances every
3,600 ms, which re-reports LCP when a larger card paints. This is a design
tension (a rotating carousel is an unstable LCP element), not a byte problem —
left intentionally un-churned rather than speculatively rewritten without a way
to measure the gain (brief §62/§63: no speculative optimization).

## Known limitations / future opportunities

- No WebP/AVIF: no encoder is available in this environment (no sharp/magick/
  cwebp). Resolution was the available, dominant lever; a modern-format pipeline
  would cut the remaining 942 KB a further ~25–35%.
- `<Img>` uses one default `sizes` tuned for the dominant ~200–260 px card, so
  tiny (40–72 px) thumbnails still pull `@480`. Per-surface `sizes` (or a
  smaller `@288` tier) would shrink those further.
- LCP re-measurement + low-end-Android throttled runs still need a real device
  or a visible, throttled Lighthouse/DevTools session.
- Repeat-visit path is already strong (SW precache shell + CacheFirst `/img/`),
  which the brief notes is where a PWA should shine; not re-measured here.
