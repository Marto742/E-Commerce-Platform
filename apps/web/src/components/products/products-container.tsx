'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@repo/ui'
import { useProducts } from '@/hooks/use-products'
import { ProductSearch } from './product-search'
import { ProductFilters } from './product-filters'
import { ActiveFilters } from './active-filters'
import { ProductGrid } from './product-grid'
import { DEFAULT_FILTERS, type ProductFiltersState } from './types'

type ViewMode = 'grid' | 'list'

function filtersFromSearchParams(params: URLSearchParams): ProductFiltersState {
  return {
    search: params.get('search') ?? '',
    categoryId: params.get('categoryId') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    sortBy: params.get('sortBy') ?? DEFAULT_FILTERS.sortBy,
    sortOrder: (params.get('sortOrder') as 'asc' | 'desc') ?? DEFAULT_FILTERS.sortOrder,
    page: Number(params.get('page') ?? 1),
    limit: Number(params.get('limit') ?? DEFAULT_FILTERS.limit),
  }
}

function buildSearchParams(filters: ProductFiltersState): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.minPrice) params.set('minPrice', filters.minPrice)
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder !== DEFAULT_FILTERS.sortOrder) params.set('sortOrder', filters.sortOrder)
  if (filters.page !== 1) params.set('page', String(filters.page))
  if (filters.limit !== DEFAULT_FILTERS.limit) params.set('limit', String(filters.limit))
  return params
}

export function ProductsContainer() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<ProductFiltersState>(() =>
    filtersFromSearchParams(searchParams)
  )
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Sync URL → state when searchParams change (back/forward navigation)
  useEffect(() => {
    setFilters(filtersFromSearchParams(searchParams))
  }, [searchParams])

  const updateFilters = useCallback(
    (next: Partial<ProductFiltersState>) => {
      const merged = { ...filters, ...next }
      setFilters(merged)
      const params = buildSearchParams(merged)
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [filters, pathname, router]
  )

  function clearAll() {
    setFilters(DEFAULT_FILTERS)
    router.push(pathname, { scroll: false })
  }

  // Build API params — exclude empty strings
  const apiParams: Record<string, string | number | boolean | undefined | null> = {
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    ...(filters.search && { search: filters.search }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
  }

  const { data, isLoading, isError } = useProducts(apiParams)

  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.sortBy !== DEFAULT_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_FILTERS.sortOrder

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          All Products
        </h1>
        {data && (
          <p className="mt-1 text-sm text-muted-foreground">
            {data.meta.total.toLocaleString()} product{data.meta.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <ProductSearch
            value={filters.search}
            onChange={(search) => updateFilters({ search, page: 1 })}
          />
        </div>

        {/* Mobile: open filters drawer */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              !
            </span>
          )}
        </button>

        {/* View mode toggles */}
        <div className="hidden items-center gap-1 rounded-md border p-1 sm:flex">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={cn(
              'rounded p-1.5 transition-colors hover:bg-accent',
              viewMode === 'grid' && 'bg-accent'
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={cn(
              'rounded p-1.5 transition-colors hover:bg-accent',
              viewMode === 'list' && 'bg-accent'
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="mb-4">
          <ActiveFilters
            filters={filters}
            defaults={DEFAULT_FILTERS}
            onChange={updateFilters}
            onClearAll={clearAll}
          />
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden w-56 shrink-0 lg:block">
          <ProductFilters filters={filters} onChange={updateFilters} />
        </div>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          <ProductGrid
            data={data}
            isLoading={isLoading}
            isError={isError}
            limit={filters.limit}
            onPageChange={(page) => updateFilters({ page })}
          />
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-background shadow-card-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-semibold">Filters</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-md p-1 hover:bg-accent"
                aria-label="Close filters"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <ProductFilters filters={filters} onChange={updateFilters} />
            </div>
            <div className="border-t px-4 py-3">
              <button
                onClick={() => {
                  clearAll()
                  setMobileFiltersOpen(false)
                }}
                className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
