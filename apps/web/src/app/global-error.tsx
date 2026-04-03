'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// global-error.tsx replaces the root layout when it triggers, so it must
// include <html> and <body> itself and cannot use shared layout components.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 font-sans text-center antialiased">
        <AlertTriangle className="size-16 text-destructive/60" />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Critical error</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {error.message || 'A critical error occurred. Please reload the page.'}
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </body>
    </html>
  )
}
