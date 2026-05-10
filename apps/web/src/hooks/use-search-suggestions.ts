'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { SearchResponse } from '@/types/api'

export const searchKeys = {
  suggestions: (query: string) => ['search-suggestions', query] as const,
  results: (query: string, page: number) => ['search-results', query, page] as const,
}

export function useSearchSuggestions(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: searchKeys.suggestions(trimmed),
    queryFn: () =>
      api.get<SearchResponse>('/search', {
        params: { q: trimmed, limit: 6 },
      }),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useSearchResults(query: string, page = 1) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: searchKeys.results(trimmed, page),
    queryFn: () =>
      api.get<SearchResponse>('/search', {
        params: { q: trimmed, limit: 24, page },
      }),
    enabled: trimmed.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}
