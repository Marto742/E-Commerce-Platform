import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 60 s — avoids redundant refetches on route changes
        staleTime: 60 * 1000,
        // Keep unused data in cache for 5 min
        gcTime: 5 * 60 * 1000,
        // Retry once on failure (not 3x — keeps UX snappy)
        retry: 1,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
        // Don't refetch on window focus in development (noisy)
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      },
      mutations: {
        // Surface mutation errors to error boundaries by default
        throwOnError: false,
      },
      dehydrate: {
        // Also dehydrate pending queries so SSR streams resolved data
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  })
}

// ── Browser singleton ─────────────────────────────────────────────────────────
// One client per browser tab; new instance per server request.
let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
