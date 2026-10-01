import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { Button, Card, Page } from '../components/ui'
import { signInWithEmail, signOut, useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

/**
 * Lightweight sign-in screen — magic-link email.
 * The app works fully signed-out; this is only needed for write operations.
 * When Supabase is not configured, shows an informational message.
 */
export default function Auth() {
  const nav = useNavigate()
  const { isAuthenticated, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    const err = await signInWithEmail(email.trim())
    setSending(false)
    if (err) setError(err)
    else setSent(true)
  }

  // Already signed in
  if (isAuthenticated && user) {
    return (
      <Page>
        <h1 className="text-xl font-semibold">Signed in</h1>
        <Card className="mt-4 p-4">
          <p className="text-sm font-medium">{user.email}</p>
          <p className="mt-1 text-xs text-faint">You can now post updates, set preferences, and place orders.</p>
        </Card>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => nav('/')}>Back to Home</Button>
          <Button variant="ghost" className="text-red-600" onClick={async () => { await signOut(); nav('/') }}>Sign out</Button>
        </div>
      </Page>
    )
  }

  // No Supabase configured
  if (!supabase) {
    return (
      <Page>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <Card className="mt-4 p-4">
          <p className="text-sm text-ink-soft">
            Authentication is not available — Supabase is not configured.
            Set <code className="text-xs bg-ivory-deep px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-xs bg-ivory-deep px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in <code className="text-xs">.env.local</code> to enable sign-in.
          </p>
        </Card>
        <Button variant="outline" className="mt-4 w-full" onClick={() => nav('/')}>Back to Home</Button>
      </Page>
    )
  }

  if (loading) {
    return <Page><div className="flex justify-center py-12"><span className="h-6 w-6 animate-spin rounded-full border-2 border-vermilion/30 border-t-vermilion" /></div></Page>
  }

  return (
    <Page>
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-xs text-ink-soft">
        Pujo Sahayak works without an account. Sign in to post live updates, set social preferences, and place marketplace orders.
      </p>

      {sent ? (
        <Card className="mt-4 p-4 text-center">
          <p className="text-sm font-medium text-emerald-600">Check your email</p>
          <p className="mt-1 text-xs text-ink-soft">We sent a magic sign-in link to {email}. Click it to complete sign-in.</p>
        </Card>
      ) : (
        <form onSubmit={handleSignIn} className="mt-4">
          <Card className="p-4">
            <label htmlFor="auth-email" className="text-xs font-medium text-ink-soft">Email address</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-ink/10 px-3 py-2.5 focus-within:border-vermilion/50">
              <Mail size={15} className="text-faint" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </Card>
          <Button type="submit" className="mt-3 w-full" disabled={sending || !email.trim()}>
            {sending ? 'Sending…' : 'Send sign-in link'}
          </Button>
        </form>
      )}

      <Button variant="ghost" className="mt-4 w-full" onClick={() => nav('/')}>Continue as guest</Button>
    </Page>
  )
}
