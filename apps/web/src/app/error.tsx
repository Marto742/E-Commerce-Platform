'use client'

import { useEffect } from 'react'
import { ErrorDisplay } from '@/components/ui/error-display'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[RootError]', error)
  }, [error])

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <ErrorDisplay
        title="Something went wrong"
        message={error.message || 'An unexpected error occurred. Please try again.'}
        onRetry={reset}
      />
    </main>
  )
}
