'use client'

import { useEffect } from 'react'
import { ErrorDisplay } from '@/components/ui/error-display'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProductsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[ProductsError]', error)
  }, [error])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ErrorDisplay
        title="Could not load products"
        message="There was a problem fetching the product catalogue. Please try again."
        onRetry={reset}
      />
    </div>
  )
}
