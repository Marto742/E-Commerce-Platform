import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductsContainer } from '@/components/products/products-container'
import { ProductCardSkeleton } from '@/components/product/product-card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { api } from '@/lib/api-client'
import type { PaginatedResponse, Category } from '@/types/api'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const response = await api.get<PaginatedResponse<Category>>('/categories', {
      params: { limit: 100, sortBy: 'sortOrder', sortOrder: 'asc' },
    })
    const category = response.data.find((c) => c.slug === slug)
    return category || null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${category.name} | Products`,
    description: `Browse products in the ${category.name} category.`,
    openGraph: {
      title: `${category.name} | ShopName`,
      description: `Browse products in the ${category.name} category.`,
      url: `${APP_URL}/categories/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${category.name} | ShopName`,
      description: `Browse products in the ${category.name} category.`,
    },
    alternates: {
      canonical: `${APP_URL}/categories/${slug}`,
    },
  }
}

function ProductsLoadingFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mb-4 h-10 animate-pulse rounded bg-muted" />
      <div className="flex gap-8">
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: 'Categories', href: '/categories' }, { label: category.name }]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {category.name}
        </h1>
      </div>

      <Suspense fallback={<ProductsLoadingFallback />}>
        <ProductsContainer categoryId={category.id} categoryName={category.name} />
      </Suspense>
    </>
  )
}
