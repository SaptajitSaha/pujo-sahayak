import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
// Self-hosted fonts — bundled locally so there is no render-blocking third-party
// network fetch on cold start (the old Google Fonts <link> cost ~2 MB / 100+
// requests and dominated first-load time on mobile). Weights match the tokens.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/800.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource/noto-serif-bengali/400.css'
import '@fontsource/noto-serif-bengali/600.css'
import '@fontsource/noto-serif-bengali/700.css'
import '@fontsource/noto-serif-bengali/800.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
