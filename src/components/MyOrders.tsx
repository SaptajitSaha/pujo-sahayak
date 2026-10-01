// ─── My Orders section ───────────────────────────────────────────────────────
// The signed-in user's marketplace orders with a compact status timeline.
// Reads the `marketplace_orders` table via the marketplace service; shows an
// honest empty state when signed out or when there are no orders.

import { useNavigate } from 'react-router-dom'
import { Package, ShoppingBag } from 'lucide-react'
import { Button, Card, QueryError, SectionHeader } from '../components/ui'
import { useAuth, useUserId } from '../lib/auth'
import { useMyOrders } from '../services/marketplace'
import { getPaymentService } from '../services/payment'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { MarketplaceOrder } from '../data/types'

const FLOW: MarketplaceOrder['status'][] = ['initiated', 'confirmed', 'shipped', 'delivered']

function money(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export function MyOrders() {
  const nav = useNavigate()
  const { isAuthenticated } = useAuth()
  const userId = useUserId()
  const { data: orders = [], isLoading, isError, refetch } = useMyOrders(userId)

  if (!isAuthenticated) {
    return (
      <section className="mt-5">
        <div className="flex items-center gap-1.5">
          <Package size={16} className="text-vermilion" />
          <SectionHeader title="My Orders" />
        </div>
        <Card className="mt-2 p-4 text-center">
          <p className="text-sm text-ink-soft">Sign in to see and manage your orders.</p>
          <Button size="sm" className="mt-2" onClick={() => nav('/auth')}><ShoppingBag size={13} /> Sign in</Button>
        </Card>
      </section>
    )
  }

  return (
    <section className="mt-5">
      <div className="flex items-center gap-1.5">
        <Package size={16} className="text-vermilion" />
        <SectionHeader title="My Orders" />
      </div>

      {isLoading ? (
        <div className="mt-2 h-16 w-full animate-pulse rounded-card bg-card" />
      ) : isError ? (
        <QueryError onRetry={() => refetch()} message="Couldn’t load your orders." />
      ) : orders.length === 0 ? (
        <Card className="mt-2 p-4 text-center">
          <p className="text-sm text-ink-soft">No orders yet.</p>
          <p className="mt-1 text-[11px] text-faint">Browse the marketplace to add something for the pujo.</p>
        </Card>
      ) : (
        <div className="mt-2 space-y-2">
          {orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </section>
  )
}

function OrderCard({ order }: { order: MarketplaceOrder }) {
  const qc = useQueryClient()
  const [paying, setPaying] = useState(false)
  const idx = FLOW.indexOf(order.status)

  const pay = async () => {
    setPaying(true)
    try {
      await getPaymentService().createPayment(order)
      qc.invalidateQueries({ queryKey: ['wallet-txns'] })
    } finally {
      setTimeout(() => setPaying(false), 800)
    }
  }

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium tabular-nums">Order · {money(order.amount)}</p>
        <span className="text-[10px] text-faint">{new Date(order.created_at).toLocaleDateString()}</span>
      </div>

      {order.status === 'initiated' ? (
        <Button size="sm" className="mt-2 w-full" onClick={pay} disabled={paying}>
          {paying ? 'Processing demo…' : 'Proceed to payment'}
        </Button>
      ) : (
        <div className="mt-2 flex items-center gap-1">
          {FLOW.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-vermilion' : 'bg-ink/10'}`}
              aria-hidden
            />
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[10px] text-faint capitalize">Status: {order.status.replace('_', ' ')}</p>
    </Card>
  )
}
