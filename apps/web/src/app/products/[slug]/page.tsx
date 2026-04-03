'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'
import { useProductBySlug } from '@/hooks/use-products'
import {
  ProductDetailView,
  ProductDetailSkeleton,
} from '@/components/product-detail/product-detail-view'
import { ApiError } from '@/lib/api-client'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params)
  const { data: product, error } = useProductBySlug(slug)

  // Guard: no data yet (covers isLoading AND disabled query when slug isn't ready)
  if (!product && !error) return <ProductDetailSkeleton />

  if (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  if (!product) notFound()

  return <ProductDetailView product={product} />
}
