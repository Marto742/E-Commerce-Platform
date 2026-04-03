'use client'

import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@repo/ui'
import { useCategories } from '@/hooks/use-categories'
import { StarRating } from '@/components/ui/star-rating'
import type { ProductFiltersState } from './types'

const RATING_OPTIONS = [4, 3, 2, 1] as const

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'createdAt:asc', label: 'Oldest' },
  { value: 'basePrice:asc', label: 'Price: Low to High' },
  { value: 'basePrice:desc', label: 'Price: High to Low' },
  { value: 'name:asc', label: 'Name: A–Z' },
  { value: 'name:desc', label: 'Name: Z–A' },
] as const

const PRICE_PRESETS = [
  { label: 'Under $25', min: '', max: '25' },
  { label: '$25 – $50', min: '25', max: '50' },
  { label: '$50 – $100', min: '50', max: '100' },
  { label: '$100 – $200', min: '100', max: '200' },
  { label: 'Over $200', min: '200', max: '' },
]

interface ProductFiltersProps {
  filters: ProductFiltersState
  onChange: (next: Partial<ProductFiltersState>) => void
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
      >
        {title}
        <ChevronDown
          className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

export function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  const { data: categoriesData, isLoading } = useCategories()
  const topCategories = categoriesData?.data.filter((c) => !c.parentId) ?? []

  const sortValue = `${filters.sortBy ?? 'createdAt'}:${filters.sortOrder ?? 'desc'}`

  function handleSortChange(value: string) {
    const [sortBy, sortOrder] = value.split(':')
    onChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 })
  }

  function handlePricePreset(min: string, max: string) {
    const isActive = filters.minPrice === min && filters.maxPrice === max
    onChange({ minPrice: isActive ? '' : min, maxPrice: isActive ? '' : max, page: 1 })
  }

  return (
    <aside className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-muted-foreground" />
        <h2 className="font-semibold">Filters</h2>
      </div>

      {/* Sort */}
      <Section title="Sort by">
        <div className="flex flex-col gap-1">
          {SORT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={sortValue === opt.value}
                onChange={() => handleSortChange(opt.value)}
                className="accent-primary"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Category */}
      <Section title="Category">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="category"
                value=""
                checked={!filters.categoryId}
                onChange={() => onChange({ categoryId: '', page: 1 })}
                className="accent-primary"
              />
              <span className="text-sm text-foreground">All categories</span>
            </label>
            {topCategories.map((cat) => (
              <label key={cat.id} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={filters.categoryId === cat.id}
                  onChange={() => onChange({ categoryId: cat.id, page: 1 })}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </Section>

      {/* Price */}
      <Section title="Price range">
        <div className="flex flex-col gap-1">
          {PRICE_PRESETS.map((preset) => {
            const active = filters.minPrice === preset.min && filters.maxPrice === preset.max
            return (
              <label key={preset.label} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handlePricePreset(preset.min, preset.max)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{preset.label}</span>
              </label>
            )
          })}
        </div>

        {/* Custom price inputs */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value, page: 1 })}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value, page: 1 })}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </Section>

      {/* Rating */}
      <Section title="Customer rating" defaultOpen={false}>
        <div className="flex flex-col gap-1.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="radio"
              name="rating"
              value=""
              checked={!filters.minRating}
              onChange={() => onChange({ minRating: '', page: 1 })}
              className="accent-primary"
            />
            <span className="text-sm text-foreground">Any rating</span>
          </label>
          {RATING_OPTIONS.map((stars) => (
            <label key={stars} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="rating"
                value={String(stars)}
                checked={filters.minRating === String(stars)}
                onChange={() => onChange({ minRating: String(stars), page: 1 })}
                className="accent-primary"
              />
              <span className="flex items-center gap-1.5">
                <StarRating rating={stars} size="sm" />
                <span className="text-sm text-foreground">& up</span>
              </span>
            </label>
          ))}
        </div>
      </Section>
    </aside>
  )
}
