import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { Button, Card, Page } from '../components/ui'
import { signInWithPassword, signUpWithPassword, signOut, useAuth } from '../lib/auth'
import { validateEmail, validatePassword } from '../lib/authValidation'
import { supabase } from '../lib/supabase'

/**
 * Sign-in / sign-up screen — email + password via Supabase Auth.
 * The app works fully signed-out; this is only needed for write operations
 * (post a note, save preferences, place an order). A direct API call, so it
 * behaves the same in the web app and the Android WebView. When Supabase is
 * not configured, shows an informational message instead of the form.
 */
type Mode = 'signin' | 'signup'

export default function Auth() {
  const nav = useNavigate()
  const { isAuthenticated, user, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Set when a sign-up succeeded but Supabase needs the user to confirm by email.
  const [needConfirm, setNeedConfirm] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setNeedConfirm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Local, offline-friendly validation before touching the network.
    const emailErr = validateEmail(email)
    const pwErr = validatePassword(password)
    if (emailErr || pwErr) {
      setError(emailErr ?? pwErr)
      return
    }
    setBusy(true)
    setError(null)
    if (mode === 'signin') {
      const err = await signInWithPassword(email, password)
      setBusy(false)
      if (err) setError(err)
      else nav('/')
    } else {
      const { error: err, signedIn } = await signUpWithPassword(email, password)
      setBusy(false)
      if (err) setError(err)
      else if (signedIn) nav('/')
      else setNeedConfirm(true)
    }
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

  if (needConfirm) {
    return (
      <Page>
        <h1 className="text-xl font-semibold">Confirm your email</h1>
        <Card className="mt-4 p-4 text-center">
          <p className="text-sm font-medium text-emerald-600">Account created</p>
          <p className="mt-1 text-xs text-ink-soft">
            We sent a confirmation link to {email.trim()}. Open it to activate your account, then sign in.
          </p>
        </Card>
        <Button variant="outline" className="mt-4 w-full" onClick={() => switchMode('signin')}>Back to sign in</Button>
      </Page>
    )
  }

  const isSignup = mode === 'signup'

  return (
    <Page>
      <h1 className="text-xl font-semibold">{isSignup ? 'Create account' : 'Sign in'}</h1>
      <p className="mt-1 text-xs text-ink-soft">
        Pujo Sahayak works without an account. Sign in to post live updates, set social preferences, and place marketplace orders.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <Card className="space-y-3 p-4">
          <div>
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
                inputMode="email"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="auth-password" className="text-xs font-medium text-ink-soft">Password</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-ink/10 px-3 py-2.5 focus-within:border-vermilion/50">
              <Lock size={15} className="text-faint" />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        </Card>

        <Button type="submit" className="mt-3 w-full" disabled={busy}>
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-ink-soft">
        {isSignup ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
          className="font-semibold text-vermilion"
        >
          {isSignup ? 'Sign in' : 'Create an account'}
        </button>
      </p>

      <Button variant="ghost" className="mt-3 w-full" onClick={() => nav('/')}>Continue as guest</Button>
    </Page>
  )
}
