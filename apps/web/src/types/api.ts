// ─── Shared primitives ────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  parentId: string | null
  isActive: boolean
  sortOrder: number
  _count?: { products: number }
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string
  url: string
  altText: string | null
  sortOrder: number
}

export interface ProductVariant {
  id: string
  sku: string
  name: string
  price: string
  stock: number
  attributes: Record<string, unknown>
  isActive: boolean
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: string
  comparePrice: string | null
  isActive: boolean
  isFeatured: boolean
  category: ProductCategory
  images: ProductImage[]
  variants: ProductVariant[]
  _count: { reviews: number }
  createdAt: string
  updatedAt: string
}

export interface ProductListItem extends Omit<Product, 'description'> {
  avgRating: number | null
  _count: { variants: number; reviews: number }
}
