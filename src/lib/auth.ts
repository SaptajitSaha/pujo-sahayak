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

/**
 * Sign in with email + password. Returns an error string, or null on success
 * (the session is then picked up by useAuth's onAuthStateChange subscription).
 * A direct API call — no email redirect — so it works the same in the WebView APK.
 */
export async function signInWithPassword(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured'
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return error?.message ?? null
}

/**
 * Create an email + password account. `signedIn` is true when Supabase returned
 * a session immediately (email confirmation disabled); false when the user must
 * confirm via email first, so the UI can show the right next step.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null; signedIn: boolean }> {
  if (!supabase) return { error: 'Supabase is not configured', signedIn: false }
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
  return { error: error?.message ?? null, signedIn: !!data.session }
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
