export interface SearchFiltersState {
  q: string
  categoryId: string
  minPrice: string
  maxPrice: string
  /** Minimum average rating ("1"–"5"); empty string = any rating */
  minRating: string
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
  minRating: '',
  inStock: false,
  sortBy: '',
  sortOrder: 'asc',
  page: 1,
}
