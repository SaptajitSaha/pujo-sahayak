// ─── Marketplace service ─────────────────────────────────────────────────────
// Product catalog + order creation over Supabase. When Supabase is not
// configured, reads fall back to clearly-labeled demo products (is_demo:true)
// so the marketplace is reviewable; orders require auth + a live backend.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/auth'
import { DEMO_PRODUCTS } from './marketplace.mock'
import type { MarketplaceProduct, MarketplaceOrder } from '../data/types'

const PRODUCTS = ['marketplace-products']
const ORDERS = ['marketplace-orders']

export function useProducts(category?: string, area?: string) {
  return useQuery<MarketplaceProduct[]>({
    queryKey: [...PRODUCTS, category ?? 'all', area ?? 'any'],
    queryFn: async () => {
      if (!supabase) {
        let list = DEMO_PRODUCTS
        if (category && category !== 'all') list = list.filter((p) => p.category === category)
        if (area) list = list.filter((p) => p.area === area)
        return list
      }
      let query = supabase.from('marketplace_products').select('*').order('created_at', { ascending: false }).limit(50)
      if (category && category !== 'all') query = query.eq('category', category)
      if (area) query = query.eq('area', area)
      const { data, error } = await query
      if (error) throw error
      const rows = (data ?? []) as MarketplaceProduct[]
      return rows.length ? rows : DEMO_PRODUCTS
    },
  })
}

export function useProduct(id: string) {
  return useQuery<MarketplaceProduct | null>({
    queryKey: [...PRODUCTS, 'one', id],
    queryFn: async () => {
      if (!supabase) return DEMO_PRODUCTS.find((p) => p.id === id) ?? null
      const { data, error } = await supabase.from('marketplace_products').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return (data as MarketplaceProduct) ?? DEMO_PRODUCTS.find((p) => p.id === id) ?? null
    },
    enabled: !!id,
  })
}

/** Create an order for a product (requires auth).
 *  Goes through the place_demo_order RPC: the amount is read from the trusted
 *  product row server-side and the status is fixed — a client can never
 *  declare its own price or order state. */
export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (product: MarketplaceProduct): Promise<MarketplaceOrder> => {
      if (!supabase) throw new Error('Orders need a live backend — not available in demo')
      const userId = await getUserId()
      if (!userId) throw new Error('Sign in to place an order')
      const { data, error } = await supabase.rpc('place_demo_order', { p_product_id: product.id })
      if (error) throw error
      if (!data) throw new Error('Order could not be created')
      return data as MarketplaceOrder
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS }),
  })
}

/** Current user's orders. */
export function useMyOrders(userId: string | null) {
  return useQuery<MarketplaceOrder[]>({
    queryKey: [...ORDERS, userId],
    queryFn: async () => {
      if (!supabase || !userId) return []
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as MarketplaceOrder[]
    },
    enabled: !!supabase && !!userId,
  })
}
