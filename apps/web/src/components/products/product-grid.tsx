'use client'

import { PackageSearch } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card'
import { Pagination } from '@/components/ui/pagination'
import type { PaginatedResponse, ProductListItem } from '@/types/api'

interface ProductGridProps {
  data: PaginatedResponse<ProductListItem> | undefined
  isLoading: boolean
  isError: boolean
  limit: number
  onPageChange: (page: number) => void
}

export function ProductGrid({ data, isLoading, isError, limit, onPageChange }: ProductGridProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageSearch className="mb-4 size-12 text-muted-foreground" />
        <p className="font-semibold text-foreground">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not load products. Please try again.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageSearch className="mb-4 size-12 text-muted-foreground" />
        <p className="font-semibold text-foreground">No products found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or search term.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Pagination meta={data.meta} onPageChange={onPageChange} />
    </div>
  )
}
