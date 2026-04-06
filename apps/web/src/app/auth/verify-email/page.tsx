'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'

type VerifyState = 'verifying' | 'success' | 'invalid' | 'no-token'

// ─── Verify on mount ─────────────────────────────────────────────────────────

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'no-token')

  // Resend form state
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    if (!token) return

    fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setState(res.ok ? 'success' : 'invalid')
      })
      .catch(() => setState('invalid'))
  }, [token])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    setResendLoading(true)
    try {
      await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } finally {
      setResendLoading(false)
      setResendSent(true) // always show success (anti-enumeration)
    }
  }

  // ── Verifying spinner ────────────────────────────────────────────────────────
  if (state === 'verifying') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Verifying your email…</p>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email verified!</h1>
            <p className="mt-2 text-sm text-gray-500">
              Your account is now active. You can sign in and start shopping.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  // ── Invalid / expired token ──────────────────────────────────────────────────
  if (state === 'invalid') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Link expired</h1>
            <p className="mt-2 text-sm text-gray-500">
              This verification link has expired or already been used. Enter your email below to get
              a new one.
            </p>
          </div>
          <ResendForm
            email={email}
            setEmail={setEmail}
            loading={resendLoading}
            sent={resendSent}
            onSubmit={handleResend}
          />
        </div>
      </div>
    )
  }

  // ── No token — arrived without a link ────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <svg
            className="h-8 w-8 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your email and we&apos;ll resend the verification link.
          </p>
        </div>
        <ResendForm
          email={email}
          setEmail={setEmail}
          loading={resendLoading}
          sent={resendSent}
          onSubmit={handleResend}
        />
        <Link
          href="/auth/login"
          className="block text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

// ─── Resend sub-form ──────────────────────────────────────────────────────────

interface ResendFormProps {
  email: string
  setEmail: (v: string) => void
  loading: boolean
  sent: boolean
  onSubmit: (e: React.FormEvent) => void
}

function ResendForm({ email, setEmail, loading, sent, onSubmit }: ResendFormProps) {
  if (sent) {
    return (
      <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
        If <strong>{email}</strong> has an unverified account, a new link has been sent.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left">
      <div className="space-y-1">
        <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <Input
          id="resend-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending…' : 'Resend verification email'}
      </Button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
