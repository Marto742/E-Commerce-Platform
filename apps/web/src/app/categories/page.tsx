import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@repo/ui'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { api } from '@/lib/api-client'
import type { PaginatedResponse, Category } from '@/types/api'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'Categories',
  description: "Browse all product categories. Find exactly what you're looking for.",
  openGraph: {
    title: 'Categories | ShopName',
    description: 'Browse all product categories.',
    url: `${APP_URL}/categories`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Categories | ShopName',
    description: 'Browse all product categories.',
  },
  alternates: {
    canonical: `${APP_URL}/categories`,
  },
}

function CategorySkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-muted">
      <div className="aspect-square rounded-t-xl bg-muted-foreground/10" />
      <div className="p-3">
        <div className="h-4 w-2/3 rounded bg-muted-foreground/10" />
      </div>
    </div>
  )
}

async function CategoriesGrid() {
  try {
    const response = await api.get<PaginatedResponse<Category>>('/categories', {
      params: { limit: 100, sortBy: 'sortOrder', sortOrder: 'asc' },
    })

    const categories = response.data.filter((c) => !c.parentId)

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((category, i) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className={cn(
              'group rounded-xl border bg-card shadow-card transition-shadow hover:shadow-card-hover',
              i === 0 && 'sm:col-span-2'
            )}
          >
            <div
              className={cn(
                'relative overflow-hidden rounded-t-xl bg-muted',
                i === 0 ? 'aspect-[2/1]' : 'aspect-square'
              )}
            >
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl">🛍️</div>
              )}
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-sm font-semibold text-foreground">{category.name}</span>
              <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    )
  } catch {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load categories. Please try again later.
      </div>
    )
  }
}

export default function CategoriesPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Categories' }]} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            All Categories
          </h1>
          <p className="mt-1 text-muted-foreground">Find exactly what you&apos;re looking for</p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          }
        >
          <CategoriesGrid />
        </Suspense>
      </div>
    </>
  )
}
