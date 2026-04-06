'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'

// ─── Config ───────────────────────────────────────────────────────────────────

/** Milliseconds of inactivity before the user is warned. */
const IDLE_WARNING_MS = 25 * 60 * 1000 // 25 min

/** Milliseconds after the warning before force sign-out. */
const IDLE_GRACE_MS = 5 * 60 * 1000 // 5 min

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'] as const

// ─── Idle timeout warning modal ───────────────────────────────────────────────

interface WarningModalProps {
  secondsLeft: number
  onStay: () => void
  onLeave: () => void
}

function IdleWarningModal({ secondsLeft, onStay, onLeave }: WarningModalProps) {
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-title"
      aria-describedby="idle-desc"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <svg
            className="h-6 w-6 text-yellow-600"
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

        <h2 id="idle-title" className="mb-1 text-lg font-semibold text-gray-900">
          Still there?
        </h2>
        <p id="idle-desc" className="mb-5 text-sm text-gray-500">
          You&apos;ve been inactive for a while. For your security, you&apos;ll be signed out in{' '}
          <strong className="text-yellow-700">{display}</strong>.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Sign out now
          </button>
          <button
            onClick={onStay}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Session guard ────────────────────────────────────────────────────────────

export function SessionGuard() {
  const { data: session } = useSession()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(IDLE_GRACE_MS / 1000)

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const graceTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const graceCountdown = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Force sign-out when refresh token has expired ────────────────────────────
  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired') {
      signOut({ callbackUrl: '/auth/login' })
    }
  }, [session?.error])

  // ── Idle timeout ─────────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (!session?.user) return

    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (showWarning) return // don't reset while warning is visible

    idleTimer.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(IDLE_GRACE_MS / 1000)

      // Countdown ticker
      graceCountdown.current = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1))
      }, 1000)

      // Force sign-out after grace period
      graceTimer.current = setTimeout(() => {
        signOut({ callbackUrl: '/auth/login' })
      }, IDLE_GRACE_MS)
    }, IDLE_WARNING_MS)
  }, [session?.user, showWarning])

  // Attach activity listeners
  useEffect(() => {
    if (!session?.user) return

    resetIdleTimer()
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetIdleTimer, { passive: true }))

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetIdleTimer))
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (graceTimer.current) clearTimeout(graceTimer.current)
      if (graceCountdown.current) clearInterval(graceCountdown.current)
    }
  }, [session?.user, resetIdleTimer])

  function handleStay() {
    setShowWarning(false)
    if (graceTimer.current) clearTimeout(graceTimer.current)
    if (graceCountdown.current) clearInterval(graceCountdown.current)
    resetIdleTimer()
  }

  function handleLeave() {
    signOut({ callbackUrl: '/auth/login' })
  }

  if (!showWarning || !session?.user) return null

  return <IdleWarningModal secondsLeft={secondsLeft} onStay={handleStay} onLeave={handleLeave} />
}
