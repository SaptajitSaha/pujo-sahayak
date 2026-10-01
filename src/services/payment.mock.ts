// ─── Mock payment adapter ────────────────────────────────────────────────────
// Implements PaymentService without touching real money or storing card data.
// Every transaction it produces is marked is_demo:true and status
// 'demo_completed' so the UI can always show the honest "DEMO — no real payment
// processed" label. Data lives in the Supabase `transactions` table when a
// backend is connected; otherwise it is session-local.

import { supabase } from '../lib/supabase'
import type { MarketplaceOrder, PaymentMethod, Transaction } from '../data/types'
import type { PaymentService, PaymentStatus } from './payment'

/** Session-local store used only when Supabase is not configured. */
const local: Transaction[] = []

const DEMO_METHODS: PaymentMethod[] = [
  { id: 'pm-demo-1', user_id: '', type: 'upi', last4: null, is_default: true, created_at: new Date().toISOString() },
]

export class MockPaymentAdapter implements PaymentService {
  async createPayment(order: MarketplaceOrder): Promise<Transaction> {
    const txn: Omit<Transaction, 'id' | 'created_at'> = {
      user_id: order.buyer_id,
      order_id: order.id,
      type: 'purchase',
      amount: order.amount,
      currency: 'INR',
      status: 'demo_completed',
      provider_txn_id: `demo_${crypto.randomUUID()}`,
      is_demo: true,
    }
    if (supabase && order.buyer_id) {
      const { data, error } = await supabase.from('transactions').insert(txn).select().single()
      if (error) throw error
      return data as Transaction
    }
    const row: Transaction = { ...txn, id: `txn_${crypto.randomUUID()}`, created_at: new Date().toISOString() }
    local.unshift(row)
    return row
  }

  async verifyPayment(txnId: string): Promise<PaymentStatus> {
    if (supabase) {
      const { data } = await supabase.from('transactions').select('status').eq('id', txnId).maybeSingle()
      return ((data?.status as PaymentStatus) ?? 'pending')
    }
    return local.find((t) => t.id === txnId)?.status ?? 'pending'
  }

  async refundPayment(txnId: string): Promise<void> {
    if (supabase) {
      await supabase.from('transactions').update({ status: 'refunded' }).eq('id', txnId)
      return
    }
    const t = local.find((x) => x.id === txnId)
    if (t) t.status = 'refunded'
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    if (supabase && userId) {
      const { data, error } = await supabase
        .from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Transaction[]
    }
    return local.filter((t) => t.user_id === userId)
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    if (supabase && userId) {
      const { data, error } = await supabase
        .from('payment_methods').select('*').eq('user_id', userId).order('is_default', { ascending: false })
      if (error) throw error
      const rows = (data ?? []) as PaymentMethod[]
      return rows.length ? rows : []
    }
    // No raw card data is ever held; a single masked UPI handle for the demo.
    return DEMO_METHODS.map((m) => ({ ...m, user_id: userId }))
  }
}
