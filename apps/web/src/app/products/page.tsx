import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ProductsContainer } from '@/components/products/products-container'
import { ProductCardSkeleton } from '@/components/product/product-card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse our full product catalogue.',
}

function ProductsLoadingFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mb-4 h-10 animate-pulse rounded bg-muted" />
      <div className="flex gap-8">
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Products' }]} />
      </div>
      <Suspense fallback={<ProductsLoadingFallback />}>
        <ProductsContainer />
      </Suspense>
    </>
  )
}
