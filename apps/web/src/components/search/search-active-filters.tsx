'use client'

import { X } from 'lucide-react'
import { useCategories } from '@/hooks/use-categories'
import type { SearchFiltersState } from './types'

interface SearchActiveFiltersProps {
  filters: SearchFiltersState
  onChange: (next: Partial<SearchFiltersState>) => void
  onClearAll: () => void
}

const SORT_LABELS: Record<string, string> = {
  'basePrice:asc': 'Price ↑',
  'basePrice:desc': 'Price ↓',
  'rating:desc': 'Top rated',
  'createdAt:desc': 'Newest',
  'name:asc': 'Name A–Z',
}

export function SearchActiveFilters({ filters, onChange, onClearAll }: SearchActiveFiltersProps) {
  const { data: categoriesData } = useCategories()
  const categoryName = categoriesData?.data.find((c) => c.id === filters.categoryId)?.name

  const chips: { label: string; onRemove: () => void }[] = []

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
  if (filters.minRating) {
    chips.push({
      label: `${filters.minRating}★ & up`,
      onRemove: () => onChange({ minRating: '', page: 1 }),
    })
  }
  if (filters.inStock) {
    chips.push({ label: 'In stock', onRemove: () => onChange({ inStock: false, page: 1 }) })
  }
  if (filters.sortBy) {
    const key = `${filters.sortBy}:${filters.sortOrder}`
    chips.push({
      label: SORT_LABELS[key] ?? key,
      onRemove: () => onChange({ sortBy: '', sortOrder: 'asc', page: 1 }),
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
