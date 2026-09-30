// One-shot helper: rasterize the app-icon master (scripts/app-icon-source.png)
// into the PNG sizes the webmanifest + iOS/Android install prompts need. Output
// is committed to public/ and android/ so the PWA manifest references stable
// files, not a build-time step. sharp is NOT a project dependency (native,
// 20 MB+); install on demand when you need to regenerate:
//   npm i --no-save sharp && node scripts/gen-icons.mjs && npm prune
// Windows alternative with no install: powershell -File scripts/make-icons.ps1
// (uses System.Drawing; produces the same set).
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const src = readFileSync(resolve(here, 'app-icon-source.png'))

async function png(size, out, { fit = 'contain', jpeg = false } = {}) {
  // 'contain' pads the logo into the safe zone (adaptive foreground);
  // 'cover' fills the whole canvas (launcher / maskable icons).
  // The three manifest icons ship as JPEG (the watercolor art is ~12x smaller
  // than PNG); everything else stays PNG (Android mipmaps, apple-touch-icon).
  const base = sharp(src).resize(size, size, { fit, background: { r: 255, g: 255, b: 255, alpha: fit === 'cover' ? 1 : 0 } })
  const buf = await (jpeg ? base.jpeg({ quality: 82 }) : base.png()).toBuffer()
  writeFileSync(resolve(root, out), buf)
  console.log(`  wrote ${out} (${buf.length} bytes)`)
}

console.log('Generating app icons from scripts/app-icon-source.png…')
// PWA manifest icons (full-bleed JPEG, white background) + favicon/apple (PNG)
await png(192, 'public/pwa-192x192.jpg', { fit: 'cover', jpeg: true })
await png(512, 'public/pwa-512x512.jpg', { fit: 'cover', jpeg: true })
await png(512, 'public/maskable-icon-512x512.jpg', { fit: 'cover', jpeg: true })
await png(64, 'public/favicon.png', { fit: 'cover' })
await png(180, 'public/apple-touch-icon.png', { fit: 'cover' })
// Android launcher + round (legacy, pre-API26) + adaptive foreground (safe zone)
const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
const fgSizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }
for (const [d, px] of Object.entries(densities)) {
  const base = `android/app/src/main/res/mipmap-${d}`
  await png(px, `${base}/ic_launcher.png`, { fit: 'cover' })
  await png(px, `${base}/ic_launcher_round.png`, { fit: 'cover' })
  await png(fgSizes[d], `${base}/ic_launcher_foreground.png`, { fit: 'contain' })
}
console.log('done.')
