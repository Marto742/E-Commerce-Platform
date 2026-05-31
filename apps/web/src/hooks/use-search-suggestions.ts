'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { SearchResponse } from '@/types/api'

export interface SearchResultsParams {
  q: string
  page?: number
  categoryId?: string
  minPrice?: string
  maxPrice?: string
  minRating?: string
  inStock?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const searchKeys = {
  suggestions: (query: string) => ['search-suggestions', query] as const,
  results: (params: SearchResultsParams) => ['search-results', params] as const,
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

export function useSearchResults(params: SearchResultsParams) {
  const trimmed = params.q.trim()
  return useQuery({
    queryKey: searchKeys.results({ ...params, q: trimmed }),
    queryFn: () =>
      api.get<SearchResponse>('/search', {
        params: {
          q: trimmed,
          limit: 24,
          page: params.page ?? 1,
          ...(params.categoryId && { categoryId: params.categoryId }),
          ...(params.minPrice && { minPrice: params.minPrice }),
          ...(params.maxPrice && { maxPrice: params.maxPrice }),
          ...(params.minRating && { minRating: params.minRating }),
          ...(params.inStock && { inStock: true }),
          ...(params.sortBy && { sortBy: params.sortBy, sortOrder: params.sortOrder ?? 'asc' }),
        },
      }),
    enabled: trimmed.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })
}
