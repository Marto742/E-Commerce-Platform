import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import { buildPaginationMeta } from '@/utils/response'

export const DEFAULT_LOW_STOCK_THRESHOLD = 10

const VARIANT_WITH_PRODUCT = {
  include: {
    product: {
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        images: {
          take: 1,
          orderBy: { sortOrder: 'asc' as const },
          select: { url: true, altText: true },
        },
      },
    },
  },
} as const

// ── Full inventory list ───────────────────────────────────────────────────────

export interface InventoryQuery {
  page: number
  limit: number
  search?: string
  productId?: string
  minStock?: number
  maxStock?: number
  isActive?: 'true' | 'false'
  sortBy?: 'stock' | 'name' | 'sku' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export async function listInventory(query: InventoryQuery) {
  const {
    page,
    limit,
    search,
    productId,
    minStock,
    maxStock,
    isActive,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = query
  const skip = (page - 1) * limit

  const where = {
    ...(productId && { productId }),
    ...(isActive !== undefined && { isActive: isActive === 'true' }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...((minStock !== undefined || maxStock !== undefined) && {
      stock: {
        ...(minStock !== undefined && { gte: minStock }),
        ...(maxStock !== undefined && { lte: maxStock }),
      },
    }),
  }

  const [variants, total] = await prisma.$transaction([
    prisma.productVariant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      ...VARIANT_WITH_PRODUCT,
    }),
    prisma.productVariant.count({ where }),
  ])

  return { variants, meta: buildPaginationMeta(total, page, limit) }
}

// ── Low-stock list ────────────────────────────────────────────────────────────

export async function listLowStock(threshold = DEFAULT_LOW_STOCK_THRESHOLD, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const where = { stock: { lte: threshold }, isActive: true }

  const [variants, total] = await prisma.$transaction([
    prisma.productVariant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { stock: 'asc' },
      ...VARIANT_WITH_PRODUCT,
    }),
    prisma.productVariant.count({ where }),
  ])

  return { variants, meta: buildPaginationMeta(total, page, limit) }
}

// ── Summary ───────────────────────────────────────────────────────────────────

export async function getStockSummary() {
  const [total, outOfStock, lowStock] = await prisma.$transaction([
    prisma.productVariant.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { isActive: true, stock: 0 } }),
    prisma.productVariant.count({
      where: {
        isActive: true,
        stock: { gt: 0, lte: DEFAULT_LOW_STOCK_THRESHOLD },
      },
    }),
  ])

  return { total, outOfStock, lowStock, threshold: DEFAULT_LOW_STOCK_THRESHOLD }
}

// ── SKU lookup ────────────────────────────────────────────────────────────────

export async function getVariantBySku(sku: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { sku },
    ...VARIANT_WITH_PRODUCT,
  })
  if (!variant) throw AppError.notFound(`No variant found with SKU "${sku}"`)
  return variant
}

// ── Bulk stock update ─────────────────────────────────────────────────────────

export interface BulkStockUpdate {
  variantId: string
  operation: 'set' | 'add' | 'subtract'
  quantity: number
}

export async function bulkUpdateStock(updates: BulkStockUpdate[]) {
  const variantIds = updates.map((u) => u.variantId)

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, sku: true, stock: true },
  })

  // Validate all variant IDs exist
  const found = new Map(variants.map((v) => [v.id, v]))
  const missing = variantIds.filter((id) => !found.has(id))
  if (missing.length > 0) {
    throw AppError.badRequest(`Variant(s) not found: ${missing.join(', ')}`)
  }

  // Pre-validate subtract operations won't go negative
  for (const update of updates) {
    if (update.operation === 'subtract') {
      const variant = found.get(update.variantId)!
      if (variant.stock < update.quantity) {
        throw AppError.badRequest(
          `Cannot subtract ${update.quantity} from SKU "${variant.sku}" (stock: ${variant.stock})`
        )
      }
    }
  }

  // Apply all updates in a single transaction
  const results = await prisma.$transaction(
    updates.map((update) => {
      const current = found.get(update.variantId)!
      const newStock =
        update.operation === 'set'
          ? update.quantity
          : update.operation === 'add'
            ? current.stock + update.quantity
            : current.stock - update.quantity

      return prisma.productVariant.update({
        where: { id: update.variantId },
        data: { stock: newStock },
        select: { id: true, sku: true, name: true, stock: true },
      })
    })
  )

  return results
}
