// ─── Payment service abstraction ─────────────────────────────────────────────
// A single interface the app depends on, so the concrete provider can be swapped
// without touching UI. Today the only implementation is the mock adapter — no
// real money ever moves and no card data is stored.
//
// SWAP PATH (documented for later): implement this interface in a
// `RazorpayPaymentAdapter` that calls the Razorpay checkout + a Supabase Edge
// Function for server-side verification, then register it in `getPaymentService`.

import type { MarketplaceOrder, PaymentMethod, Transaction } from '../data/types'
import { MockPaymentAdapter } from './payment.mock'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'demo_completed'

export interface PaymentService {
  createPayment(order: MarketplaceOrder): Promise<Transaction>
  verifyPayment(txnId: string): Promise<PaymentStatus>
  refundPayment(txnId: string): Promise<void>
  getTransactions(userId: string): Promise<Transaction[]>
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>
}

// The active provider. Swap this to a real adapter (e.g. RazorpayPaymentAdapter)
// when server-side payment verification is wired up — no UI change needed.
let _service: PaymentService | null = null

export function getPaymentService(): PaymentService {
  if (!_service) _service = new MockPaymentAdapter()
  return _service
}
