'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useFeaturedProducts } from '@/hooks/use-products'
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card'

export function FeaturedProducts() {
  const { data, isLoading, isError } = useFeaturedProducts(8)
  const products = data?.data ?? []

  return (
    <section className="bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Featured Products
            </h2>
            <p className="mt-1 text-muted-foreground">Handpicked just for you</p>
          </div>
          <Link
            href="/products?featured=true"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {isError && (
          <p className="text-sm text-muted-foreground">
            Could not load products. Please try again later.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        {!isLoading && products.length === 0 && !isError && (
          <p className="py-12 text-center text-muted-foreground">No featured products yet.</p>
        )}

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/products?featured=true"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all products <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
