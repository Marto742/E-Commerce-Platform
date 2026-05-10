'use client'

import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useSearchResults } from '@/hooks/use-search-suggestions'
import { SearchHitCard } from '@/components/search/search-hit-card'
import { Pagination } from '@/components/ui/pagination'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

interface SearchResultsProps {
  query: string
  page: number
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

export function SearchResults({ query, page }: SearchResultsProps) {
  const router = useRouter()
  const { data, isLoading, isError } = useSearchResults(query, page)

  const hits = data?.data ?? []
  const meta = data?.meta

  function goToPage(p: number) {
    const params = new URLSearchParams({ q: query, page: String(p) })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: query ? `Search: "${query}"` : 'Search' }]}
      />

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-foreground">
          {query ? (
            <>
              Results for <span className="text-primary">&ldquo;{query}&rdquo;</span>
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
      </div>

      {!query ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Search className="size-10 text-muted-foreground" />
          <p className="text-lg font-medium">Enter a search term above</p>
        </div>
      ) : isLoading ? (
        <SearchResultsSkeleton />
      ) : isError ? (
        <p className="py-12 text-center text-muted-foreground">Something went wrong. Try again.</p>
      ) : hits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Search className="size-10 text-muted-foreground" />
          <p className="text-lg font-medium">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-muted-foreground">Try a different search term.</p>
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
                onPageChange={goToPage}
              />
            </div>
          )}
        </>
      )}
    </main>
  )
}
