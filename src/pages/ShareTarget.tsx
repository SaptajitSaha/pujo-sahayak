import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * PWA share_target handler. The manifest registers `action: '/share-target'`
 * with `method: 'GET'` and `params: { title, text, url }`, so when another
 * app shares a link *into* Pujo Sahayak, the OS opens this URL with the
 * three fields attached as query params. The service worker is configured
 * (`navigateFallbackDenylist`) to let `/share-target` fall through to the
 * app shell — we do the routing here.
 *
 * Strategy: parse the incoming `url`, and if it's a link back to our own
 * `/pandal/:id` or `/restaurant/:id`, deep-link to that record. Anything
 * else we surface as a search query against pandal names + areas. This is
 * the "someone shared me a pandal link" flow the plan called out; nothing
 * hits the network.
 */
export default function ShareTarget() {
  const nav = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const raw = params.get('url') ?? ''
    const title = params.get('title') ?? ''
    const text = params.get('text') ?? ''

    // Same-origin pandal/restaurant URL → route directly to the detail page.
    // Accepts absolute (`https://pujosahayak.app/pandal/pandal-suruchi`) or
    // relative (`/pandal/pandal-suruchi`) shapes so manual paste works too.
    const idMatch = raw.match(/\/(pandal|restaurant)\/([\w-]+)/)
    if (idMatch) {
      nav(`/${idMatch[1]}/${idMatch[2]}`, { replace: true })
      return
    }

    // Otherwise try to infer a pandal by name from the incoming metadata.
    // `q` is what the user would have typed — the title of a shared page is
    // usually the pandal's display name.
    const hay = `${title} ${text}`.trim()
    if (hay) {
      nav(`/search?q=${encodeURIComponent(hay.split(/\s+/).slice(0, 4).join(' '))}`, { replace: true })
      return
    }

    // Nothing recognisable — home is the honest fallback.
    nav('/', { replace: true })
  }, [nav, params])

  // A one-frame loading state — the redirect fires in the effect immediately;
  // we never actually paint anything but this. Kept minimal so the SW + app
  // shell hand-off doesn't produce a visible white flash.
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-vermilion/30 border-t-vermilion" />
    </div>
  )
}
