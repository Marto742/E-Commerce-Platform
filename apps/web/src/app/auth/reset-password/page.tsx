'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'

// ─── Password strength indicator (shared pattern with register page) ──────────

interface StrengthRule {
  label: string
  pass: (v: string) => boolean
}

const RULES: StrengthRule[] = [
  { label: 'At least 8 characters', pass: (v) => v.length >= 8 },
  { label: 'One uppercase letter', pass: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', pass: (v) => /[a-z]/.test(v) },
  { label: 'One number', pass: (v) => /[0-9]/.test(v) },
]

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const passed = RULES.filter((r) => r.pass(password)).length

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= passed
                ? passed <= 1
                  ? 'bg-red-400'
                  : passed <= 2
                    ? 'bg-orange-400'
                    : passed <= 3
                      ? 'bg-yellow-400'
                      : 'bg-green-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <ul className="space-y-0.5">
        {RULES.map((rule) => (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs ${rule.pass(password) ? 'text-green-600' : 'text-gray-400'}`}
          >
            <span>{rule.pass(password) ? '✓' : '○'}</span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Invalid token state ──────────────────────────────────────────────────────

function InvalidToken() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Link expired or invalid</h2>
        <p className="text-sm text-gray-500">
          This password reset link has expired or already been used. Please request a new one.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-block rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Request a new link
        </Link>
      </div>
    </div>
  )
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Password updated</h2>
        <p className="text-sm text-gray-500">
          Your password has been reset. All existing sessions have been signed out.
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Sign in with new password
        </Link>
      </div>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [invalidToken, setInvalidToken] = useState(!token)

  if (invalidToken) return <InvalidToken />
  if (done) return <SuccessScreen />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ token, password }),
      })

      if (res.status === 422) {
        setInvalidToken(true)
        return
      }
      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      setDone(true)
      setTimeout(() => router.push('/auth/login'), 4000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Set a new password</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a strong password for your account.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <PasswordStrength password={password} />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>

        <p className="text-center text-sm">
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
