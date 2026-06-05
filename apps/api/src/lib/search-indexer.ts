import { prisma } from './prisma'
import { meili } from './meilisearch'
import { PRODUCTS_INDEX, type ProductDocument } from './search-schema'
import { invalidateSearchCache } from '@/modules/search/search.service'

const BATCH_SIZE = 500

type ProductVariantRow = {
  sku: string
  name: string
  price: { toNumber(): number } | number
  stock: number
}
type ProductImageRow = { url: string }
type ProductWithRelations = {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string
  basePrice: { toNumber(): number } | number
  comparePrice: { toNumber(): number } | number | null
  isActive: boolean
  isFeatured: boolean
  createdAt: Date
  category: { name: string }
  images: ProductImageRow[]
  variants: ProductVariantRow[]
}

/** Average rating + review count for a product, used to populate search facets. */
type RatingSummary = { rating: number; reviewCount: number }

const NO_RATING: RatingSummary = { rating: 0, reviewCount: 0 }

function toNum(v: { toNumber(): number } | number): number {
  return typeof v === 'number' ? v : v.toNumber()
}

/** Aggregate review rating/count for a set of products in a single query. */
async function ratingsByProduct(productIds: string[]): Promise<Map<string, RatingSummary>> {
  const map = new Map<string, RatingSummary>()
  if (productIds.length === 0) return map

  const grouped = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: { rating: true },
  })

  for (const row of grouped) {
    map.set(row.productId, {
      // Round to 1 decimal to match the product rating summary endpoint
      rating: Math.round((row._avg.rating ?? 0) * 10) / 10,
      reviewCount: row._count.rating,
    })
  }
  return map
}

function toDocument(product: ProductWithRelations, ratingSummary: RatingSummary): ProductDocument {
  const prices = product.variants.map((v) => toNum(v.price))
  const minPrice = prices.length ? Math.min(...prices) : toNum(product.basePrice)
  const maxPrice = prices.length ? Math.max(...prices) : toNum(product.basePrice)
  const inStock = product.variants.some((v) => v.stock > 0)

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    categoryId: product.categoryId,
    categoryName: product.category.name,
    basePrice: toNum(product.basePrice),
    comparePrice: product.comparePrice ? toNum(product.comparePrice) : null,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    imageUrl: product.images[0]?.url ?? null,
    skus: product.variants.map((v) => v.sku),
    variantNames: product.variants.map((v) => v.name),
    minPrice,
    maxPrice,
    inStock,
    rating: ratingSummary.rating,
    reviewCount: ratingSummary.reviewCount,
    ratingBucket: Math.floor(ratingSummary.rating),
    createdAt: Math.floor(product.createdAt.getTime() / 1000),
  }
}

const INCLUDE = {
  category: { select: { id: true, name: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: { where: { isActive: true } },
} as const

/** Full re-index: fetches all products from DB and replaces the index. */
export async function reindexAllProducts(): Promise<{ indexed: number }> {
  const index = meili.index(PRODUCTS_INDEX)
  let cursor: string | undefined
  let indexed = 0

  for (;;) {
    const products = await prisma.product.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      include: INCLUDE,
    })

    if (!products.length) break

    const ratings = await ratingsByProduct(products.map((p) => p.id))
    const docs = products.map((p) => toDocument(p, ratings.get(p.id) ?? NO_RATING))
    await index.addDocuments(docs, { primaryKey: 'id' })
    indexed += docs.length
    cursor = products[products.length - 1].id
  }

  invalidateSearchCache()
  return { indexed }
}

/** Upsert a single product into the search index. */
export async function indexProduct(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: INCLUDE,
  })

  if (!product) {
    await meili.index(PRODUCTS_INDEX).deleteDocument(productId)
    invalidateSearchCache()
    return
  }

  const ratings = await ratingsByProduct([productId])
  await meili
    .index(PRODUCTS_INDEX)
    .addDocuments([toDocument(product, ratings.get(productId) ?? NO_RATING)], { primaryKey: 'id' })
  invalidateSearchCache()
}

/** Remove a product from the search index. */
export async function deleteProductFromIndex(productId: string): Promise<void> {
  await meili.index(PRODUCTS_INDEX).deleteDocument(productId)
  invalidateSearchCache()
}
