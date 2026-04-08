'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

interface Category {
  id: string
  name: string
}

interface Props {
  categories: Category[]
}

export function ProductFilters({ categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 whenever a filter changes
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className={`flex flex-wrap gap-3 ${isPending ? 'opacity-60' : ''}`}>
      {/* Search */}
      <input
        type="search"
        placeholder="Search products…"
        defaultValue={searchParams.get('search') ?? ''}
        onChange={(e) => update('search', e.target.value)}
        className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* Category */}
      <select
        value={searchParams.get('categoryId') ?? ''}
        onChange={(e) => update('categoryId', e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Status */}
      <select
        value={searchParams.get('isActive') ?? ''}
        onChange={(e) => update('isActive', e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All statuses</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      {/* Featured */}
      <select
        value={searchParams.get('isFeatured') ?? ''}
        onChange={(e) => update('isFeatured', e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Featured &amp; non-featured</option>
        <option value="true">Featured only</option>
        <option value="false">Non-featured only</option>
      </select>

      {/* Sort */}
      <select
        value={`${searchParams.get('sortBy') ?? 'createdAt'}:${searchParams.get('sortOrder') ?? 'desc'}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(':')
          const params = new URLSearchParams(searchParams.toString())
          params.set('sortBy', sortBy!)
          params.set('sortOrder', sortOrder!)
          params.delete('page')
          startTransition(() => router.push(`${pathname}?${params.toString()}`))
        }}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="createdAt:desc">Newest first</option>
        <option value="createdAt:asc">Oldest first</option>
        <option value="name:asc">Name A–Z</option>
        <option value="name:desc">Name Z–A</option>
        <option value="basePrice:asc">Price low–high</option>
        <option value="basePrice:desc">Price high–low</option>
      </select>
    </div>
  )
}
