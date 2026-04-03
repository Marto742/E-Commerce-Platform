'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { PaginatedResponse, RatingSummary, Review } from '@/types/api'

export const reviewKeys = {
  all: ['reviews'] as const,
  list: (productId: string, params?: Record<string, string | number | boolean | undefined>) =>
    [...reviewKeys.all, 'list', productId, params] as const,
  summary: (productId: string) => [...reviewKeys.all, 'summary', productId] as const,
}

export function useProductReviews(
  productId: string,
  params: Record<string, string | number | boolean | undefined> = {}
) {
  return useQuery({
    queryKey: reviewKeys.list(productId, params),
    queryFn: () => api.get<PaginatedResponse<Review>>(`/products/${productId}/reviews`, { params }),
    enabled: !!productId,
  })
}

export function useRatingSummary(productId: string) {
  return useQuery({
    queryKey: reviewKeys.summary(productId),
    queryFn: () =>
      api
        .get<{ data: RatingSummary }>(`/products/${productId}/reviews/summary`)
        .then((r) => r.data),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
  })
}
