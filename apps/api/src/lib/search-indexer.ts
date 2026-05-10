import { prisma } from './prisma'
import { meili } from './meilisearch'
import { PRODUCTS_INDEX, type ProductDocument } from './search-schema'

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

function toNum(v: { toNumber(): number } | number): number {
  return typeof v === 'number' ? v : v.toNumber()
}

function toDocument(product: ProductWithRelations): ProductDocument {
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

    const docs = products.map(toDocument)
    await index.addDocuments(docs, { primaryKey: 'id' })
    indexed += docs.length
    cursor = products[products.length - 1].id
  }

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
    return
  }

  await meili.index(PRODUCTS_INDEX).addDocuments([toDocument(product)], { primaryKey: 'id' })
}

/** Remove a product from the search index. */
export async function deleteProductFromIndex(productId: string): Promise<void> {
  await meili.index(PRODUCTS_INDEX).deleteDocument(productId)
}
