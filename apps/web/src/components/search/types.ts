export interface SearchFiltersState {
  q: string
  categoryId: string
  minPrice: string
  maxPrice: string
  inStock: boolean
  /** Empty string = relevance (Meilisearch default ranking) */
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
}

export const DEFAULT_SEARCH_FILTERS: SearchFiltersState = {
  q: '',
  categoryId: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  sortBy: '',
  sortOrder: 'asc',
  page: 1,
}
