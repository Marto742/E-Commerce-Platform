import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { buildPaginationMeta } from '@/utils/response'
import { paginationSchema } from '@repo/validation'

// ─── Import ───────────────────────────────────────────────────────────────────

const importRowSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  categorySlug: z.string().min(1),
  basePrice: z.number().nonnegative(),
  comparePrice: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  variantSku: z.string().optional(),
  variantName: z.string().optional(),
  variantPrice: z.number().nonnegative().optional(),
  variantStock: z.number().int().nonnegative().default(0),
  variantAttributes: z.record(z.string()).optional(),
})

export const importProductsBodySchema = z.object({
  rows: z.array(importRowSchema).min(1).max(500),
})

export type ImportProductsInput = z.infer<typeof importProductsBodySchema>

export interface ImportResult {
  imported: number
  skipped: number
  errors: Array<{ row: number; slug: string; error: string }>
}

export async function importProducts(input: ImportProductsInput): Promise<ImportResult> {
  const { rows } = input

  // Collect all category slugs and resolve them up front
  const categorySlugs = [...new Set(rows.map((r) => r.categorySlug))]
  const categories = await prisma.category.findMany({
    where: { slug: { in: categorySlugs } },
    select: { id: true, slug: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

  // Group rows by product slug to collect variants
  const productMap = new Map<
    string,
    {
      rowIndex: number
      data: (typeof rows)[number]
      variants: Array<{
        sku: string
        name: string
        price: number
        stock: number
        attributes: Record<string, string>
      }>
    }
  >()

  const errors: ImportResult['errors'] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const existing = productMap.get(row.slug)
    if (existing) {
      // Additional variant for an already-seen product slug
      if (row.variantSku && row.variantName && row.variantPrice != null) {
        existing.variants.push({
          sku: row.variantSku,
          name: row.variantName,
          price: row.variantPrice,
          stock: row.variantStock ?? 0,
          attributes: row.variantAttributes ?? {},
        })
      }
    } else {
      const variant =
        row.variantSku && row.variantName && row.variantPrice != null
          ? {
              sku: row.variantSku,
              name: row.variantName,
              price: row.variantPrice,
              stock: row.variantStock ?? 0,
              attributes: row.variantAttributes ?? {},
            }
          : null

      productMap.set(row.slug, {
        rowIndex: i + 1,
        data: row,
        variants: variant ? [variant] : [],
      })
    }
  }

  let imported = 0
  let skipped = 0

  for (const [slug, { rowIndex, data, variants }] of productMap) {
    const categoryId = categoryMap.get(data.categorySlug)
    if (!categoryId) {
      errors.push({ row: rowIndex, slug, error: `Category "${data.categorySlug}" not found` })
      skipped++
      continue
    }

    // Skip if slug already exists
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
    if (existing) {
      errors.push({ row: rowIndex, slug, error: `Slug "${slug}" already exists` })
      skipped++
      continue
    }

    // Validate variant SKUs are unique within the batch and DB
    const skusInBatch = variants.map((v) => v.sku)
    const duplicateSku = await prisma.productVariant.findFirst({
      where: { sku: { in: skusInBatch } },
      select: { sku: true },
    })
    if (duplicateSku) {
      errors.push({ row: rowIndex, slug, error: `SKU "${duplicateSku.sku}" already in use` })
      skipped++
      continue
    }

    try {
      await prisma.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description ?? null,
          categoryId,
          basePrice: data.basePrice,
          comparePrice: data.comparePrice ?? null,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          variants: {
            create: variants.map((v) => ({
              sku: v.sku,
              name: v.name,
              price: v.price,
              stock: v.stock,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              attributes: JSON.parse(JSON.stringify(v.attributes)),
              isActive: true,
            })),
          },
        },
      })
      imported++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      errors.push({ row: rowIndex, slug, error: msg })
      skipped++
    }
  }

  return { imported, skipped, errors }
}

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

// ─── Export ───────────────────────────────────────────────────────────────────

function escapeCsv(val: unknown): string {
  const str = val == null ? '' : String(val)
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsv).join(',')
}

export async function exportProducts(): Promise<string> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      comparePrice: true,
      isActive: true,
      isFeatured: true,
      createdAt: true,
      category: { select: { name: true } },
      _count: { select: { variants: true, reviews: true } },
      variants: { where: { isActive: true }, select: { stock: true } },
    },
  })

  const header = toCsvRow([
    'id',
    'name',
    'slug',
    'category',
    'base_price',
    'compare_price',
    'total_stock',
    'variants',
    'reviews',
    'is_active',
    'is_featured',
    'created_at',
  ])

  const rows = products.map((p) =>
    toCsvRow([
      p.id,
      p.name,
      p.slug,
      p.category.name,
      Number(p.basePrice).toFixed(2),
      p.comparePrice != null ? Number(p.comparePrice).toFixed(2) : '',
      p.variants.reduce((sum, v) => sum + v.stock, 0),
      p._count.variants,
      p._count.reviews,
      p.isActive,
      p.isFeatured,
      p.createdAt.toISOString(),
    ])
  )

  return [header, ...rows].join('\n')
}

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
