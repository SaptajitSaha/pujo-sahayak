import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, MIN_PASSWORD } from './authValidation'

// Pure, dependency-free credential validation — the only testable slice of the
// auth flow (the rest is thin supabase-js wrappers). Errors are user-facing
// strings; null means valid.

describe('validateEmail', () => {
  it('requires a non-empty value', () => {
    expect(validateEmail('')).toBe('Email is required')
    expect(validateEmail('   ')).toBe('Email is required')
  })

  it('rejects malformed addresses', () => {
    expect(validateEmail('no-at-sign')).toBe('Enter a valid email address')
    expect(validateEmail('a@b')).toBe('Enter a valid email address')
    expect(validateEmail('a b@c.com')).toBe('Enter a valid email address')
    expect(validateEmail('@missing-local.com')).toBe('Enter a valid email address')
  })

  it('accepts well-formed addresses, ignoring surrounding whitespace', () => {
    expect(validateEmail('you@example.com')).toBeNull()
    expect(validateEmail('  you@example.com  ')).toBeNull()
    expect(validateEmail('first.last+tag@sub.domain.co')).toBeNull()
  })
})

describe('validatePassword', () => {
  it('requires a non-empty value', () => {
    expect(validatePassword('')).toBe('Password is required')
  })

  it(`rejects passwords shorter than ${MIN_PASSWORD} characters`, () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD - 1))).toContain(String(MIN_PASSWORD))
  })

  it('accepts a password at or above the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD))).toBeNull()
    expect(validatePassword('a'.repeat(MIN_PASSWORD + 8))).toBeNull()
  })
})
