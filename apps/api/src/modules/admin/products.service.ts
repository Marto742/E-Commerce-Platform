import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { buildPaginationMeta } from '@/utils/response'
import { paginationSchema } from '@repo/validation'

export const adminProductQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  isFeatured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sortBy: z.enum(['name', 'basePrice', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type AdminProductQueryInput = z.infer<typeof adminProductQuerySchema>

export async function listAdminProducts(query: AdminProductQueryInput) {
  const {
    page,
    limit,
    search,
    categoryId,
    isActive,
    isFeatured,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query

  const skip = (page - 1) * limit

  const where = {
    ...(isActive !== undefined && { isActive }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true, altText: true } },
        _count: { select: { variants: true, reviews: true } },
        variants: {
          where: { isActive: true },
          select: { stock: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  return {
    products: products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    })),
    meta: buildPaginationMeta(total, page, limit),
  }
}
