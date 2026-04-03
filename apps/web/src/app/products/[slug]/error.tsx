'use client'

import { useEffect } from 'react'
import { ErrorDisplay } from '@/components/ui/error-display'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProductDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[ProductDetailError]', error)
  }, [error])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ErrorDisplay
        title="Could not load product"
        message="There was a problem loading this product. It may have been removed or is temporarily unavailable."
        onRetry={reset}
      />
    </div>
  )
}
