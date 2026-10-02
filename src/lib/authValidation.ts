// ─── Credential validation (pure) ────────────────────────────────────────────
// Dependency-free checks used by the sign-in / sign-up form before we hit
// Supabase. Supabase validates too, but failing here gives instant, local,
// offline-friendly UX (and works identically in the WebView APK). Each returns
// a user-facing error string, or null when the value is acceptable.

export const MIN_PASSWORD = 8

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Trim-tolerant email format check. */
export function validateEmail(email: string): string | null {
  const value = email.trim()
  if (!value) return 'Email is required'
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address'
  return null
}

/** Presence + minimum-length check. Password is not trimmed — spaces are meaningful. */
export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters`
  return null
}
