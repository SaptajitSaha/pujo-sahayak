// ─── Wallet component ────────────────────────────────────────────────────────
// Transaction history + stored payment methods + subscription status. Driven by
// the PaymentService abstraction. When the adapter is the mock, every row shows
// a "DEMO" marker and the panel states plainly that no real money moved. We show
// a transaction history, not a balance — no fake wallet total.

import { useQuery } from '@tanstack/react-query'
import { CreditCard, Wallet as WalletIcon } from 'lucide-react'
import { Card, QueryError, SectionHeader } from '../components/ui'
import { getPaymentService } from '../services/payment'
import type { PaymentMethod, Transaction } from '../data/types'

const STATUS_STYLES: Record<Transaction['status'], string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  demo_completed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  refunded: 'bg-ink/10 text-faint',
}

function money(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export function Wallet({ userId }: { userId: string | null }) {
  const svc = getPaymentService()

  const { data: txns = [], isLoading, isError, refetch } = useQuery<Transaction[]>({
    queryKey: ['wallet-txns', userId],
    queryFn: () => svc.getTransactions(userId ?? ''),
  })
  const { data: methods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['wallet-methods', userId],
    queryFn: () => svc.getPaymentMethods(userId ?? ''),
  })

  const anyDemo = txns.some((t) => t.is_demo)

  return (
    <section className="mt-5">
      <div className="flex items-center gap-1.5">
        <WalletIcon size={16} className="text-vermilion" />
        <SectionHeader title="Wallet" />
      </div>

      {/* Payment methods — masked, tokenized only */}
      {methods.length > 0 && (
        <Card className="mt-2 p-3">
          <p className="mb-1.5 text-xs font-medium text-ink-soft">Payment methods</p>
          <div className="space-y-1.5">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <CreditCard size={14} className="text-faint" />
                <span className="capitalize">{m.type}</span>
                {m.last4 && <span className="text-faint">•••• {m.last4}</span>}
                {m.is_default && <span className="ml-auto rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] text-ink-soft">Default</span>}
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-faint">No card numbers are stored — only a masked reference.</p>
        </Card>
      )}

      {/* Transaction history */}
      <Card className="mt-2 p-3">
        <p className="mb-1.5 text-xs font-medium text-ink-soft">Transaction history</p>
        {isLoading ? (
          <div className="h-6 w-full animate-pulse rounded bg-ivory-deep" />
        ) : isError ? (
          <QueryError onRetry={() => refetch()} message="Couldn’t load your transactions." />
        ) : txns.length === 0 ? (
          <p className="py-2 text-center text-xs text-faint">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-ink/5">
            {txns.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate capitalize">{t.type}</p>
                  <p className="text-[10px] text-faint">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{money(t.amount)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[t.status]}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {anyDemo && (
        <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
          DEMO — no real payment was processed. Real transactions require a connected payment provider.
        </p>
      )}
    </section>
  )
}
