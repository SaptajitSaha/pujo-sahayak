import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Pujo Sahayak',
        short_name: 'PujoSahayak',
        description:
          'See the Puja. Understand the story. Pandal discovery, planning and Maya, your AI companion for Kolkata.',
        theme_color: '#7c3aed',
        background_color: '#160E0A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          // SVG is the primary form factor on Android and works fine in Chrome
          // PWA install prompts. The PNG raster icons are generated once via
          // scripts/gen-icons.mjs (from public/icon.svg) and committed here so
          // iOS Safari, older Android WebViews and Lighthouse's PWA audit all
          // see a matching pixel-size entry.
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Long-press app-icon shortcuts (Android 8.0+ launchers). Each maps to
        // an in-app route so the Service Worker scope handles the navigation.
        shortcuts: [
          { name: 'Ask Maya', short_name: 'Maya', description: 'Chat with Maya about pandals', url: '/maya', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Plan my day', short_name: 'Plan', description: 'Open the Puja Planner', url: '/planner', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Emergency', short_name: 'SOS', description: 'Safety and helplines', url: '/safety', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
        // Accept shared URLs from other apps (Chrome "Share → Pujo Sahayak").
        // The service worker intercepts POST/GET on /share-target and redirects
        // to the app shell with the URL in the query string; App.tsx parses it.
        // `encodings` is WebManifest-spec but not in vite-plugin-pwa's TS types.
        share_target: {
          action: '/share-target',
          method: 'GET',
          params: { title: 'title', text: 'text', url: 'url' },
          encodings: ['url'],
        } as any,
      },
      workbox: {
        // Precache the app shell + every JS/CSS/font/asset chunk Vite emits,
        // so a fully-installed PWA works first paint offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Navigate fallback: any HTML navigation not in cache serves index.html
        // so client-side routing works offline.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/share-target/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Runtime caching — anything not precached (imagery from public/img,
        // dynamically-loaded route chunks after user navigation, OS font
        // fallbacks). Long-tail assets stay fresh enough to feel live, cached
        // enough to feel instant.
        // vite-plugin-pwa 0.21's RuntimeCaching TS shape is narrower than
        // workbox's actual runtime, so the whole array is cast once here.
        runtimeCaching: [
          {
            // The HTML shell is served NetworkFirst so a fresh deploy is
            // picked up on the very next open, but the cached shell boots the
            // app offline.
            urlPattern: ({ request }: any) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-shell',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Bundled images under /img/ are content-hashed or editorially
            // static — safe to CacheFirst for 30 days.
            urlPattern: ({ url }: any) => url.pathname.startsWith('/img/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'img-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Self-hosted fontsource files never change without a rebuild, so
            // SWR keeps them served instantly from cache while a background
            // revalidation picks up any rebuild.
            urlPattern: ({ url }: any) => url.pathname.startsWith('/assets/') && url.pathname.endsWith('.css'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'css-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }: any) => url.pathname.endsWith('.woff2') || url.pathname.includes('/fontsource/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'font-cache',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tile-server responses (OSM/Carto) — never precached, kept warm
            // for 1 day so re-panning the map during a puja-day offline stretch
            // doesn't re-download tiles.
            urlPattern: ({ url }: any) =>
              url.hostname.endsWith('.tile.openstreetmap.org') ||
              url.hostname.includes('.basemaps.cartocdn.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ] as any,
      },
    }),
  ],
  build: {
    // Split vendor libs so their hash stays stable across app-code deploys —
    // a user's cached framer-motion chunk survives every UI change.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-framer': ['framer-motion'],
          'vendor-lucide': ['lucide-react'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-zustand': ['zustand'],
        },
      },
    },
  },
})
