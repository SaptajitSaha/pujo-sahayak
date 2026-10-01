// ─── Metro network map (/transport/metro/map) ────────────────────────────────
// The animated full-system diagram on its own subpage, reached from the Metro
// guide's "Metro network map" tile. Kept separate so the guide stays a scannable
// reference list and the map gets the whole screen to trace itself across.
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Map as MapIcon } from 'lucide-react'
import { Page } from '../components/ui'
import MetroNetworkMap from '../components/MetroNetworkMap'
import { useApp } from '../store'

export default function MetroMap() {
  const nav = useNavigate()
  const bn = useApp((s) => s.lang) === 'bn'

  return (
    <Page>
      <button onClick={() => nav(-1)} className="mb-1 flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink">
        <ArrowLeft size={16} /> {bn ? 'ফিরে যান' : 'Back'}
      </button>

      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400"><MapIcon size={22} /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{bn ? 'মেট্রো নেটওয়ার্ক মানচিত্র' : 'Metro network map'}</h1>
          <p className={`mt-0.5 text-xs text-faint ${bn ? 'bn' : ''}`}>
            {bn ? 'পুরো নেটওয়ার্ক — লাইন ধরে ধরে আঁকা' : 'The whole system, traced line by line'}
          </p>
        </div>
      </header>

      <div className="mt-3">
        <MetroNetworkMap bn={bn} />
      </div>
    </Page>
  )
}
