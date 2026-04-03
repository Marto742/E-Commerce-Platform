'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@repo/ui'

interface ErrorDisplayProps {
  title?: string
  message?: string
  /** If provided, renders a "Try again" button wired to this function */
  onRetry?: () => void
  /** Show a back-to-home link (default true) */
  showHomeLink?: boolean
  className?: string
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  showHomeLink = true,
  className,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4 py-20 text-center', className)}
    >
      <AlertTriangle className="size-14 text-destructive/60" />
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        )}
        {showHomeLink && (
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go home
          </Link>
        )}
      </div>
    </div>
  )
}
