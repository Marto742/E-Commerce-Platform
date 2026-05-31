import type { Index } from 'meilisearch'

import { meili } from './meilisearch'

export interface ProductDocument {
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  categoryName: string
  basePrice: number
  comparePrice: number | null
  isActive: boolean
  isFeatured: boolean
  imageUrl: string | null
  skus: string[]
  variantNames: string[]
  minPrice: number
  maxPrice: number
  inStock: boolean
  rating: number // average review rating (0 when no reviews) — for display
  reviewCount: number
  ratingBucket: number // floor(rating), 0 when no reviews — for filtering & facets
  createdAt: number // unix timestamp for sorting
}

const PRODUCTS_INDEX = 'products'

export async function setupSearchSchema(): Promise<void> {
  await meili.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' }).catch(() => {
    // index already exists — ignore
  })
  const index: Index = meili.index(PRODUCTS_INDEX)

  await index.updateSettings({
    searchableAttributes: ['name', 'description', 'categoryName', 'variantNames', 'skus'],
    filterableAttributes: [
      'categoryId',
      'isActive',
      'isFeatured',
      'inStock',
      'basePrice',
      'minPrice',
      'maxPrice',
      'ratingBucket',
    ],
    sortableAttributes: ['basePrice', 'minPrice', 'createdAt', 'name', 'rating'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
    pagination: {
      maxTotalHits: 1000,
    },
  })
}

export { PRODUCTS_INDEX }
