'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchResults } from '@/hooks/use-search-suggestions'
import { SearchHitCard } from '@/components/search/search-hit-card'
import { SearchFilters } from '@/components/search/search-filters'
import { SearchActiveFilters } from '@/components/search/search-active-filters'
import { Pagination } from '@/components/ui/pagination'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { DEFAULT_SEARCH_FILTERS, type SearchFiltersState } from '@/components/search/types'

function filtersFromSearchParams(params: URLSearchParams): SearchFiltersState {
  return {
    q: params.get('q') ?? '',
    categoryId: params.get('categoryId') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minRating: params.get('minRating') ?? '',
    inStock: params.get('inStock') === 'true',
    sortBy: params.get('sortBy') ?? '',
    sortOrder: (params.get('sortOrder') as 'asc' | 'desc') ?? 'asc',
    page: Number(params.get('page') ?? 1),
  }
}

function buildSearchParams(filters: SearchFiltersState): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.minPrice) params.set('minPrice', filters.minPrice)
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
  if (filters.minRating) params.set('minRating', filters.minRating)
  if (filters.inStock) params.set('inStock', 'true')
  if (filters.sortBy) {
    params.set('sortBy', filters.sortBy)
    params.set('sortOrder', filters.sortOrder)
  }
  if (filters.page !== 1) params.set('page', String(filters.page))
  return params
}

function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SearchResults() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<SearchFiltersState>(() =>
    filtersFromSearchParams(searchParams)
  )
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Sync URL → state on back/forward navigation
  useEffect(() => {
    setFilters(filtersFromSearchParams(searchParams))
  }, [searchParams])

  const updateFilters = useCallback(
    (next: Partial<SearchFiltersState>) => {
      const merged = { ...filters, ...next }
      setFilters(merged)
      const qs = buildSearchParams(merged).toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [filters, pathname, router]
  )

  const clearAll = useCallback(() => {
    const reset = { ...DEFAULT_SEARCH_FILTERS, q: filters.q }
    setFilters(reset)
    const qs = buildSearchParams(reset).toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [filters.q, pathname, router])

  const { data, isLoading, isError } = useSearchResults({
    q: filters.q,
    page: filters.page,
    categoryId: filters.categoryId,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minRating: filters.minRating,
    inStock: filters.inStock,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  })

  const hits = data?.data ?? []
  const meta = data?.meta
  const facets = data?.facets

  const hasActiveFilters =
    filters.categoryId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating ||
    filters.inStock ||
    filters.sortBy

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: filters.q ? `Search: "${filters.q}"` : 'Search' },
        ]}
      />

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-foreground">
          {filters.q ? (
            <>
              Results for <span className="text-primary">&ldquo;{filters.q}&rdquo;</span>
            </>
          ) : (
            'Search'
          )}
        </h1>
        {meta && (
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.total} {meta.total === 1 ? 'result' : 'results'}
            {meta.processingTimeMs != null && ` · ${meta.processingTimeMs}ms`}
          </p>
        )}
        {meta?.suggestion && (
          <p className="mt-1 text-sm text-muted-foreground">
            Did you mean{' '}
            <button
              onClick={() => updateFilters({ q: meta.suggestion as string, page: 1 })}
              className="font-medium italic text-primary underline-offset-2 hover:underline"
            >
              {meta.suggestion}
            </button>
            ?
          </p>
        )}
      </div>

      {!filters.q ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Search className="size-10 text-muted-foreground" />
          <p className="text-lg font-medium">Enter a search term above</p>
        </div>
      ) : (
        <>
          {/* Mobile filter toggle */}
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mb-4">
              <SearchActiveFilters
                filters={filters}
                onChange={updateFilters}
                onClearAll={clearAll}
              />
            </div>
          )}

          <div className="flex gap-8">
            {/* Desktop sidebar */}
            <div className="hidden w-56 shrink-0 lg:block">
              <SearchFilters filters={filters} onChange={updateFilters} facets={facets} />
            </div>

            {/* Results */}
            <div className="min-w-0 flex-1">
              {isLoading ? (
                <SearchResultsSkeleton />
              ) : isError ? (
                <p className="py-12 text-center text-muted-foreground">
                  Something went wrong. Try again.
                </p>
              ) : hits.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-24 text-center">
                  <Search className="size-10 text-muted-foreground" />
                  <p className="text-lg font-medium">No results for &ldquo;{filters.q}&rdquo;</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different search term or adjust your filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {hits.map((hit) => (
                      <SearchHitCard key={hit.id} hit={hit} />
                    ))}
                  </div>

                  {meta && meta.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        meta={{
                          page: meta.page,
                          limit: meta.limit,
                          total: meta.total,
                          totalPages: meta.totalPages,
                          hasNextPage: meta.page < meta.totalPages,
                          hasPrevPage: meta.page > 1,
                        }}
                        onPageChange={(page) => updateFilters({ page })}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-background shadow-card-lg lg:hidden">
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
              <SearchFilters filters={filters} onChange={updateFilters} facets={facets} />
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
    </main>
  )
}
