import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ProductsContainer } from '@/components/products/products-container'
import { ProductCardSkeleton } from '@/components/product/product-card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'Deals & Discounts',
  description: 'Browse our exclusive deals and discounts on top products.',
  openGraph: {
    title: 'Deals & Discounts | ShopName',
    description: 'Browse our exclusive deals and discounts on top products.',
    url: `${APP_URL}/deals`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Deals & Discounts | ShopName',
    description: 'Browse our exclusive deals and discounts on top products.',
  },
  alternates: {
    canonical: `${APP_URL}/deals`,
  },
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

export default function DealsPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Deals' }]} />
      </div>
      <Suspense fallback={<ProductsLoadingFallback />}>
        <DealsContainer />
      </Suspense>
    </>
  )
}

function DealsContainer() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Deals & Discounts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check out our exclusive deals and save on top products
        </p>
      </div>

      <ProductsContainer dealOnly />
    </div>
  )
}
