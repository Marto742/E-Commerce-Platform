'use client'

import { X } from 'lucide-react'
import { useCategories } from '@/hooks/use-categories'
import type { ProductFiltersState } from './types'

interface ActiveFiltersProps {
  filters: ProductFiltersState
  defaults: ProductFiltersState
  onChange: (next: Partial<ProductFiltersState>) => void
  onClearAll: () => void
}

export function ActiveFilters({ filters, defaults, onChange, onClearAll }: ActiveFiltersProps) {
  const { data: categoriesData } = useCategories()
  const categoryName = categoriesData?.data.find((c) => c.id === filters.categoryId)?.name

  const chips: { label: string; onRemove: () => void }[] = []

  if (filters.search) {
    chips.push({ label: `"${filters.search}"`, onRemove: () => onChange({ search: '', page: 1 }) })
  }
  if (filters.categoryId) {
    chips.push({
      label: categoryName ?? 'Category',
      onRemove: () => onChange({ categoryId: '', page: 1 }),
    })
  }
  if (filters.minPrice || filters.maxPrice) {
    const label =
      filters.minPrice && filters.maxPrice
        ? `$${filters.minPrice} – $${filters.maxPrice}`
        : filters.minPrice
          ? `From $${filters.minPrice}`
          : `Up to $${filters.maxPrice}`
    chips.push({ label, onRemove: () => onChange({ minPrice: '', maxPrice: '', page: 1 }) })
  }
  if (filters.sortBy !== defaults.sortBy || filters.sortOrder !== defaults.sortOrder) {
    const sortLabels: Record<string, string> = {
      'createdAt:asc': 'Oldest first',
      'basePrice:asc': 'Price ↑',
      'basePrice:desc': 'Price ↓',
      'name:asc': 'Name A–Z',
      'name:desc': 'Name Z–A',
    }
    const key = `${filters.sortBy}:${filters.sortOrder}`
    chips.push({
      label: sortLabels[key] ?? key,
      onRemove: () => onChange({ sortBy: defaults.sortBy, sortOrder: defaults.sortOrder, page: 1 }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            aria-label={`Remove filter: ${chip.label}`}
            className="ml-0.5 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}
