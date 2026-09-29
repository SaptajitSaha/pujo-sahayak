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
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
