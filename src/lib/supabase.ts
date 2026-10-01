// ─── Supabase client ────────────────────────────────────────────────────────
// Single shared instance for all server interactions (auth, realtime, queries).
// Uses the anon/public key — safe to expose in the client bundle. RLS enforces
// access control on the server; no service key lives here.
//
// When env vars are absent (local development without a Supabase project),
// exports a null client so all services gracefully degrade to their mock adapters.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

/**
 * Supabase client — null when the project is not configured.
 * Services check this and fall back to mock adapters.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

/** Type helper: services can assert the client exists when their code path requires it. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
    )
  }
  return supabase
}
