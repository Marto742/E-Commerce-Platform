export interface ProductFiltersState {
  search: string
  categoryId: string
  minPrice: string
  maxPrice: string
  minRating: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export const DEFAULT_FILTERS: ProductFiltersState = {
  search: '',
  categoryId: '',
  minPrice: '',
  maxPrice: '',
  minRating: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 24,
}
