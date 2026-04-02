'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { cn } from '@repo/ui'
import { useCategories } from '@/hooks/use-categories'

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

export function CategoryGrid() {
  const { data, isLoading, isError } = useCategories()

  const categories = data?.data.filter((c) => !c.parentId).slice(0, 8) ?? []

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Shop by Category
            </h2>
            <p className="mt-1 text-muted-foreground">Find exactly what you&apos;re looking for</p>
          </div>
          <Link
            href="/categories"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {isError && <p className="text-sm text-muted-foreground">Could not load categories.</p>}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((category, i) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className={cn(
                    'group rounded-xl border bg-card shadow-card transition-shadow hover:shadow-card-hover',
                    // Make the first category span 2 cols on larger screens for visual variety
                    i === 0 && 'sm:col-span-2'
                  )}
                >
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-t-xl bg-muted',
                      i === 0 ? 'aspect-[2/1] sm:aspect-[2/1]' : 'aspect-square'
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

        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href="/categories"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all categories <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
