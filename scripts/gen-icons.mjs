// One-shot helper: rasterize public/icon.svg into the three PNG sizes the
// webmanifest needs (192, 512, 512-maskable). Output is committed to public/
// so the PWA manifest and iOS/Android install prompts reference stable files,
// not a build-time step. sharp is NOT a project dependency (native, 20 MB+);
// install it on demand when you need to regenerate:
//   npm i --no-save sharp && node scripts/gen-icons.mjs && npm prune
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const svgPath = resolve(root, 'public/icon.svg')
const svg = readFileSync(svgPath)

function maskableSvg(svgBuf) {
  // Maskable icons must fill the whole safe-zone square. The default icon has
  // rx=112 rounded corners which show up as a transparent ring after the
  // launcher crops a circle. Strip the rounding for the maskable variant.
  return Buffer.from(svgBuf.toString('utf8').replaceAll(' rx="112"', ''))
}

async function png(size, out, { maskable = false } = {}) {
  const src = maskable ? maskableSvg(svg) : svg
  const buf = await sharp(src, { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer()
  writeFileSync(resolve(root, `public/${out}`), buf)
  console.log(`  wrote public/${out} (${buf.length} bytes)`)
}

console.log('Generating PWA PNG icons from public/icon.svg…')
await png(192, 'pwa-192x192.png')
await png(512, 'pwa-512x512.png')
await png(512, 'maskable-icon-512x512.png', { maskable: true })
console.log('done.')
