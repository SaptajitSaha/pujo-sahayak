// ─── Marketplace page ────────────────────────────────────────────────────────
// Local puja commerce: product grid, category filters, detail modal, order CTA.
// When Supabase is unavailable the catalog is clearly-labeled demo data and
// "Add to order" explains that checkout needs a live backend — we never fake a
// completed purchase.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Store } from 'lucide-react'
import { BackHeader, Button, Card, Chip, EASE, Img, Page, QueryError } from '../components/ui'
import { useProducts, useCreateOrder } from '../services/marketplace'
import { MARKETPLACE_CATEGORIES } from '../services/marketplace.mock'
import { useAuth } from '../lib/auth'
import type { MarketplaceProduct, Palette } from '../data/types'

/** Deterministic palette per category so each card has a warm, distinct tile. */
const CAT_PALETTE: Record<string, Palette> = {
  clothing: { from: '#4a1230', to: '#963a5c' },
  accessories: { from: '#5c3a0a', to: '#c08a2a' },
  puja_essentials: { from: '#3a2410', to: '#8a5a1e' },
  handmade: { from: '#1a1230', to: '#4a3070' },
  experiences: { from: '#4a1508', to: '#a8401c' },
  partner_offers: { from: '#2a1e0c', to: '#7a5a24' },
}

const money = (n: number) => (n > 0 ? `₹${n.toLocaleString('en-IN')}` : 'Free')

export default function Marketplace() {
  const nav = useNavigate()
  const { isAuthenticated } = useAuth()
  const [cat, setCat] = useState('all')
  const [selected, setSelected] = useState<MarketplaceProduct | null>(null)
  const { data: products = [], isLoading, isError, refetch } = useProducts(cat)
  const createOrder = useCreateOrder()
  const [toast, setToast] = useState<string | null>(null)
  const note = (s: string) => { setToast(s); setTimeout(() => setToast(null), 2600) }

  const order = (p: MarketplaceProduct) => {
    if (!isAuthenticated) { nav('/auth'); return }
    createOrder.mutate(p, {
      onSuccess: () => note('Order initiated — proceed to payment to confirm.'),
      onError: (e) => note((e as Error).message),
    })
  }

  const grid = products

  return (
    <Page>
      <BackHeader title="Marketplace" />
      <p className="mt-1 text-sm text-ink-soft">Puja essentials, attire, handmade finds and experiences from local sellers.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {MARKETPLACE_CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-card bg-card" />)}
        </div>
      ) : isError ? (
        <QueryError onRetry={() => refetch()} message="Couldn’t load the marketplace catalog." />
      ) : grid.length === 0 ? (
        <p className="mt-6 text-center text-sm text-faint">No products in this category yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {grid.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
              onClick={() => setSelected(p)}
              className="text-left"
            >
              <Card className="overflow-hidden transition-transform hover:scale-[1.02]">
                <Img palette={CAT_PALETTE[p.category] ?? CAT_PALETTE.handmade} alt={p.name} className="h-28" />
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5">
                    <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">{p.name}</p>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-faint"><Store size={10} /> {p.area}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-vermilion">{money(p.price)}</span>
                    {p.is_demo && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Demo</span>}
                  </div>
                </div>
              </Card>
            </motion.button>
          ))}
        </div>
      )}

      <p className="mt-4 text-[10px] text-faint">
        Listings marked “Demo” are illustrative for development. Real seller catalogs and checkout arrive with a connected backend.
      </p>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} onOrder={() => order(selected)} orderPending={createOrder.isPending} />}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-night px-4 py-2 text-xs text-on-image shadow-lift">
          {toast}
        </div>
      )}
    </Page>
  )
}

function ProductModal({ product, onClose, onOrder, orderPending }: {
  product: MarketplaceProduct
  onClose: () => void
  onOrder: () => void
  orderPending: boolean
}) {
  const label = product.partner_status === 'partner' ? 'Verified partner' : product.partner_status === 'verified' ? 'Verified seller' : 'Independent seller'
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/60" onClick={onClose} role="presentation">
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-lg rounded-t-2xl bg-card p-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="mp-title"
      >
        <Img palette={CAT_PALETTE[product.category] ?? CAT_PALETTE.handmade} alt={product.name} className="h-40 w-full rounded-xl" />
        <div className="mt-3 flex items-start justify-between gap-2">
          <h3 id="mp-title" className="text-lg font-semibold">{product.name}</h3>
          <span className="text-lg font-semibold text-vermilion">{money(product.price)}</span>
        </div>
        <p className="mt-0.5 text-xs text-faint capitalize">{product.category.split('_').join(' ')} · {product.area}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{product.description}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-ivory-deep px-2.5 py-1 text-ink-soft">{label}</span>
          <span className={`rounded-full px-2.5 py-1 ${product.availability === 'out_of_stock' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
            {product.availability.split('_').join(' ')}
          </span>
          {product.is_demo && <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Demo listing</span>}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button className="flex-1" disabled={product.availability === 'out_of_stock' || orderPending} onClick={onOrder}>
            <ShoppingBag size={14} /> {orderPending ? 'Adding…' : 'Add to order'}
          </Button>
        </div>
        {product.is_demo && (
          <p className="mt-2 text-[10px] text-faint">Demo product — adding creates an order only when a live backend is connected.</p>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}
