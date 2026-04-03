'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { PaginatedResponse, ProductListItem } from '@/types/api'

export const searchKeys = {
  suggestions: (query: string) => ['search-suggestions', query] as const,
}

export function useSearchSuggestions(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: searchKeys.suggestions(trimmed),
    queryFn: () =>
      api.get<PaginatedResponse<ProductListItem>>('/products', {
        params: { search: trimmed, limit: 6, sortBy: 'name', sortOrder: 'asc' },
      }),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}
