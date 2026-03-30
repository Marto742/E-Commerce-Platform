import { prisma } from '@/lib/prisma'
import { buildPaginationMeta } from '@/utils/response'

const DEFAULT_LOW_STOCK_THRESHOLD = 10

export async function listLowStock(threshold = DEFAULT_LOW_STOCK_THRESHOLD, page = 1, limit = 20) {
  const skip = (page - 1) * limit

  const where = { stock: { lte: threshold }, isActive: true }

  const [variants, total] = await prisma.$transaction([
    prisma.productVariant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { stock: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            images: {
              take: 1,
              orderBy: { sortOrder: 'asc' },
              select: { url: true, altText: true },
            },
          },
        },
      },
    }),
    prisma.productVariant.count({ where }),
  ])

  return { variants, meta: buildPaginationMeta(total, page, limit) }
}

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
