'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export function InventoryFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const search = searchParams.get('search') ?? ''
  const isActive = searchParams.get('isActive') ?? ''
  const sortBy = searchParams.get('sortBy') ?? ''
  const sortOrder = searchParams.get('sortOrder') ?? ''
  const tab = searchParams.get('tab') ?? 'all'

  return (
    <div className={`space-y-3 ${isPending ? 'opacity-60' : ''}`}>
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        {(['all', 'low-stock'] as const).map((t) => (
          <button
            key={t}
            onClick={() => update('tab', t === 'all' ? '' : t)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'all' ? 'All Variants' : 'Low Stock'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <input
          type="search"
          placeholder="Search name or SKU…"
          defaultValue={search}
          onChange={(e) => update('search', e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
        />

        {/* Active filter */}
        <select
          value={isActive}
          onChange={(e) => update('isActive', e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {/* Sort by */}
        <select
          value={sortBy}
          onChange={(e) => update('sortBy', e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Sort by: Updated</option>
          <option value="stock">Stock</option>
          <option value="name">Name</option>
          <option value="sku">SKU</option>
        </select>

        {/* Sort order */}
        <select
          value={sortOrder}
          onChange={(e) => update('sortOrder', e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Order: Desc</option>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  )
}
