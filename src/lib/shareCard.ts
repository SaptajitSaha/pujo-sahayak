// Canvas-based "share card" generator for a pandal. Runs entirely on-device,
// no external image service, no network.
//
// Design constraints (from plan §Phase 5):
//   - Portrait 1080×1350 (Instagram 4:5) — reads well in a WhatsApp/IG share.
//   - Composite = pandal hero photo (or the deterministic palette gradient as
//     a fallback for demo content without imagery) + a warm bottom scrim so the
//     text stays legible + brand mark + short human URL + tagline.
//   - Await `document.fonts.ready` before drawing text so the Playfair/Inter
//     self-hosted subsets are actually loaded. On Android WebView a share
//     card drawn too early renders with the fallback serif and looks off.
//   - Return Blob (not object URL) so the caller can either feed it to
//     navigator.share({ files }) or hand it to an <a download>.
//
// No QR is embedded. A pure-JS QR generator would add ~3 KB gz to every page
// bundle for a code that only a phone-with-a-second-screen can scan — this is
// a mobile-first single-screen flow. Instead, the card shows the URL in a
// clean text badge, which is honest and legible.
import type { Place } from '../data/types'

const W = 1080
const H = 1350

export interface ShareCardOpts {
  /** Short link shown as text on the card. Real deployments use a URL-shrtn
      service; in the demo the origin + route is used verbatim. */
  url: string
  /** Optional override of the tagline under the pandal name. */
  tagline?: string
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Rounded-corner rect — canvas has no native API for this. */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function makeShareCard(place: Place, opts: ShareCardOpts): Promise<Blob> {
  // Fonts must be resolved before we draw — the fallback stack otherwise draws
  // "Pujo Sahayak" in system-ui and the Bengali name (if any) in tofu.
  if (document.fonts?.ready) await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available on this device.')

  // Background — palette gradient always, photographic overlay if we have one.
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, place.palette.from)
  g.addColorStop(1, place.palette.to)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  if (place.palette.img) {
    const img = await loadImage(place.palette.img)
    if (img) {
      // Cover-fill the canvas; slight scale-up so edges don't show gaps
      // after the rounded-rect crop.
      const scale = Math.max(W / img.width, H / img.height) * 1.02
      const iw = img.width * scale
      const ih = img.height * scale
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih)
    }
  }

  // Warm scrim from bottom so the text block stays legible over any image.
  const scrim = ctx.createLinearGradient(0, H * 0.35, 0, H)
  scrim.addColorStop(0, 'rgba(0,0,0,0)')
  scrim.addColorStop(0.6, 'rgba(20,10,6,0.75)')
  scrim.addColorStop(1, 'rgba(15,8,4,0.95)')
  ctx.fillStyle = scrim
  ctx.fillRect(0, 0, W, H)

  // Grain pass — 4000 randomly placed 1-px dots at 8% opacity to break the
  // flat digital gradient. Cheap and stays on the compositor for the PNG
  // encoding step.
  ctx.fillStyle = 'rgba(255, 228, 180, 0.08)'
  for (let i = 0; i < 4000; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }

  // Brand mark — top-left "পূ" tile + "Pujo Sahayak" caption.
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  roundRect(ctx, 48, 48, 88, 88, 22)
  ctx.fill()
  ctx.font = '700 52px "Noto Serif Bengali", "Playfair Display", serif'
  ctx.fillStyle = '#EFD9A7'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('পূ', 48 + 44, 48 + 46)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '700 32px "Playfair Display", serif'
  ctx.fillStyle = '#F3C566'
  ctx.fillText('Pujo Sahayak', 152, 88)
  ctx.font = '500 22px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText('See the Puja. Understand the story.', 152, 122)

  // Pandal name — Playfair display size, wrapped to max 3 lines.
  const name = place.name
  ctx.font = '800 82px "Playfair Display", serif'
  ctx.fillStyle = '#FFFFFF'
  const maxTextWidth = W - 96
  const words = name.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > maxTextWidth && cur) { lines.push(cur); cur = w }
    else cur = test
  }
  if (cur) lines.push(cur)
  const block = lines.slice(0, 3)
  const nameTop = H - 320 - block.length * 96
  block.forEach((line, i) => ctx.fillText(line, 48, nameTop + i * 96))

  // Area + theme subtitle — Inter 500, marigold colour ties into the palette.
  ctx.font = '500 34px Inter, sans-serif'
  ctx.fillStyle = '#F3C566'
  const sub = [place.area, place.theme ? `· ${place.theme}` : ''].filter(Boolean).join(' ')
  ctx.fillText(sub, 48, nameTop + block.length * 96 + 20)

  // URL badge — a subtle pill at the very bottom.
  const urlText = opts.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  ctx.font = '600 28px Inter, sans-serif'
  const urlW = ctx.measureText(urlText).width + 60
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  roundRect(ctx, 48, H - 118, urlW, 60, 30)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(urlText, 78, H - 78)
  // Right-side tagline
  ctx.textAlign = 'right'
  ctx.font = '500 24px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.fillText(opts.tagline ?? 'Plan your Pujo →', W - 48, H - 78)
  ctx.textAlign = 'left'

  // Encode → Blob. PNG is lossless and share-sheet friendly; JPEG is ~2×
  // smaller but introduces chroma blur on the gradient text.
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode share card.'))), 'image/png', 0.95)
  })
}

/**
 * Attempt to share the PNG via the Web Share API (Android + iOS Safari 16.4+).
 * Falls back to <a download> when the browser doesn't support sharing files
 * (desktop Chrome, older WebViews). Returns true if the OS-level sheet opened.
 */
export async function shareCardFile(blob: Blob, filename: string, title: string): Promise<boolean> {
  const file = new File([blob], filename, { type: 'image/png' })
  const canShareFile =
    typeof navigator !== 'undefined' &&
    'canShare' in navigator &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  if (canShareFile && navigator.share) {
    try {
      await navigator.share({ title, files: [file] })
      return true
    } catch {
      /* user cancelled or share failed — fall through to download */
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
  return false
}
