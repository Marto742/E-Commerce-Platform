'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { PaginatedResponse, Category } from '@/types/api'

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () =>
      api.get<PaginatedResponse<Category>>('/categories', {
        params: { limit: 20, sortBy: 'sortOrder', sortOrder: 'asc' },
      }),
    staleTime: 10 * 60 * 1000,
  })
}
