// ─── Supabase Auth (magic-link, optional) ────────────────────────────────────
// The app works fully signed-out for public browsing. Auth is required only for
// write operations (post note, create order, set preferences).
// When Supabase is not configured, all auth calls are no-ops and the user
// remains in "guest" mode.

import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

const INITIAL: AuthState = { session: null, user: null, loading: !!supabase, isAuthenticated: false }

/** React hook: subscribes to Supabase auth state changes. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(INITIAL)

  useEffect(() => {
    if (!supabase) { setState({ ...INITIAL, loading: false }); return }
    // Restore existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
        isAuthenticated: !!data.session,
      })
    })
    // Listen for changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
        isAuthenticated: !!session,
      })
    })
    return () => subscription.unsubscribe()
  }, [])

  return state
}

/** Send a magic-link email to sign in. Returns error string or null on success. */
export async function signInWithEmail(email: string): Promise<string | null> {
  if (!supabase) return 'Supabase not configured'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return error?.message ?? null
}

/** Sign out. Always safe to call. */
export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

/** Get the current user ID from Supabase session (async — for service calls outside React). */
export async function getUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

/** Synchronous session check from a stored reference (for use inside components). */
export function useUserId(): string | null {
  const { user } = useAuth()
  return user?.id ?? null
}
