'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { PaginatedResponse, Product, ProductListItem } from '@/types/api'

export const productKeys = {
  all: ['products'] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  list: (params: Record<string, string | number | boolean | undefined | null>) =>
    [...productKeys.all, 'list', params] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  slug: (slug: string) => [...productKeys.all, 'slug', slug] as const,
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: () =>
      api.get<PaginatedResponse<ProductListItem>>('/products', {
        params: { isFeatured: true, limit, sortBy: 'createdAt', sortOrder: 'desc' },
      }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useProducts(
  params: Record<string, string | number | boolean | undefined | null> = {}
) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => api.get<PaginatedResponse<ProductListItem>>('/products', { params }),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => api.get<{ data: Product }>(`/products/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: productKeys.slug(slug),
    queryFn: () => api.get<{ data: Product }>(`/products/slug/${slug}`).then((r) => r.data),
    enabled: !!slug,
  })
}
