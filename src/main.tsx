import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
// Self-hosted fonts — bundled locally so there is no render-blocking third-party
// network fetch on cold start (the old Google Fonts <link> cost ~2 MB / 100+
// requests and dominated first-load time on mobile). Scoped to the subsets this
// app actually renders — Latin + Latin-ext (EN, accented venue names) and Bengali
// (BN) — so we don't ship the Cyrillic/Greek/Vietnamese slices inside the APK.
// Hindi falls back to the system Devanagari font. Weights match the tokens.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-ext-600.css'
import '@fontsource/inter/latin-ext-700.css'
import '@fontsource/playfair-display/latin-500.css'
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/playfair-display/latin-800.css'
import '@fontsource/playfair-display/latin-900.css'
import '@fontsource/playfair-display/latin-ext-700.css'
import '@fontsource/playfair-display/latin-ext-800.css'
import '@fontsource/noto-serif-bengali/bengali-400.css'
import '@fontsource/noto-serif-bengali/bengali-600.css'
import '@fontsource/noto-serif-bengali/bengali-700.css'
import '@fontsource/noto-serif-bengali/bengali-800.css'
import '@fontsource/noto-serif-bengali/latin-400.css'
import '@fontsource/noto-serif-bengali/latin-700.css'
import './index.css'
import App, { preloadRoutes } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Warm every code-split page's JS chunk while the inline CSS boot splash is
// still on-screen and fonts are decoding, so a later tap on any bottom-nav
// item resolves React.lazy from Vite's module cache — no Suspense fallback,
// no black loading flash between pages.
preloadRoutes()

/* ── Boot-splash hand-off ──────────────────────────────────────────────────
   The festive intro is pure CSS/HTML inline in index.html, so it paints on the
   very first frame and animates on the compositor (no JS) while this ~116 KB
   bundle + fonts + Home are still loading. Once the app has mounted and fonts
   have settled, fade it out to reveal Home. Tap dismisses it immediately. */
function hideBoot() {
  const boot = document.getElementById('boot')
  if (!boot || boot.classList.contains('boot-hide')) return
  boot.classList.add('boot-hide')
  boot.addEventListener('transitionend', () => boot.remove(), { once: true })
  window.setTimeout(() => boot.remove(), 700) // safety if transitionend never fires
}
document.getElementById('boot')?.addEventListener('pointerdown', hideBoot)

const bootStart = performance.now()
const bootReduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const bootMin = bootReduce ? 200 : 700
;(document.fonts?.ready ?? Promise.resolve())
  .then(() => new Promise((r) => setTimeout(r, Math.max(0, bootMin - (performance.now() - bootStart)))))
  .then(hideBoot)
