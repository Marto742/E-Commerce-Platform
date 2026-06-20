import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { indexProducts } from '@/lib/search-indexer'
import {
  importProducts,
  exportProducts,
  listAdminProducts,
  type ImportProductsInput,
} from './products.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findMany: vi.fn() },
    product: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    productVariant: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/search-indexer', () => ({
  indexProducts: vi.fn(),
}))

type ImportRow = ImportProductsInput['rows'][number]

function row(overrides: Partial<ImportRow> = {}): ImportRow {
  return {
    name: 'Sneaker',
    slug: 'sneaker',
    categorySlug: 'shoes',
    basePrice: 49.99,
    isActive: true,
    isFeatured: false,
    variantStock: 0,
    ...overrides,
  } as ImportRow
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('importProducts', () => {
  it('imports a new product (no variants) and reindexes', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([{ id: 'cat-1', slug: 'shoes' }] as never)
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null as never)
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null as never)
    vi.mocked(prisma.product.create).mockResolvedValue({ id: 'p1' } as never)

    const result = await importProducts({ rows: [row()] })

    expect(result).toEqual({ imported: 1, skipped: 0, errors: [] })
    expect(prisma.product.create).toHaveBeenCalledTimes(1)
    expect(indexProducts).toHaveBeenCalledWith(['p1'])
  })

  it('groups multiple rows with the same slug into one product with many variants', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([{ id: 'cat-1', slug: 'shoes' }] as never)
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null as never)
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null as never)
    vi.mocked(prisma.product.create).mockResolvedValue({ id: 'p1' } as never)

    await importProducts({
      rows: [
        row({ variantSku: 'S-1', variantName: 'Small', variantPrice: 49.99, variantStock: 5 }),
        row({ variantSku: 'S-2', variantName: 'Large', variantPrice: 49.99, variantStock: 3 }),
      ],
    })

    const createArg = vi.mocked(prisma.product.create).mock.calls[0]![0] as {
      data: { variants: { create: unknown[] } }
    }
    expect(createArg.data.variants.create).toHaveLength(2)
  })

  it('skips a row whose category is unknown', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([] as never)

    const result = await importProducts({ rows: [row({ categorySlug: 'ghost' })] })

    expect(result.imported).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.errors[0]!.error).toMatch(/Category/i)
    expect(prisma.product.create).not.toHaveBeenCalled()
  })

  it('skips a row whose slug already exists', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([{ id: 'cat-1', slug: 'shoes' }] as never)
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'existing' } as never)

    const result = await importProducts({ rows: [row()] })

    expect(result.skipped).toBe(1)
    expect(result.errors[0]!.error).toMatch(/already exists/i)
  })

  it('skips a row whose variant SKU is already in use', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([{ id: 'cat-1', slug: 'shoes' }] as never)
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null as never)
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({ sku: 'S-1' } as never)

    const result = await importProducts({
      rows: [row({ variantSku: 'S-1', variantName: 'Small', variantPrice: 10 })],
    })

    expect(result.skipped).toBe(1)
    expect(result.errors[0]!.error).toMatch(/already in use/i)
  })
})

describe('exportProducts', () => {
  it('produces a CSV with a header and CSV-escaped values', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'p1',
        name: 'Tee, Red', // comma forces CSV quoting
        slug: 'tee-red',
        basePrice: '10.00',
        comparePrice: '12.00',
        isActive: true,
        isFeatured: false,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        category: { name: 'Apparel' },
        _count: { variants: 2, reviews: 3 },
        variants: [{ stock: 5 }, { stock: 2 }],
      },
    ] as never)

    const csv = await exportProducts()
    const [header, dataRow] = csv.split('\n')

    expect(header).toContain('total_stock')
    expect(dataRow).toContain('"Tee, Red"') // quoted because it contains a comma
    expect(dataRow).toContain('10.00')
    expect(dataRow).toContain(',7,') // total stock = 5 + 2
  })

  it('leaves compare_price blank when null', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'p1',
        name: 'Plain',
        slug: 'plain',
        basePrice: '5.00',
        comparePrice: null,
        isActive: true,
        isFeatured: false,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        category: { name: 'Apparel' },
        _count: { variants: 0, reviews: 0 },
        variants: [],
      },
    ] as never)

    const csv = await exportProducts()
    expect(csv.split('\n')[1]).toContain('5.00,,0') // base_price, (blank compare), total_stock
  })
})

describe('listAdminProducts', () => {
  it('coerces basePrice to a number and computes total stock', async () => {
    const products = [
      {
        id: 'p1',
        name: 'Tee',
        slug: 'tee',
        basePrice: '10.00',
        isActive: true,
        isFeatured: false,
        createdAt: new Date('2026-06-01'),
        category: { id: 'c1', name: 'Apparel' },
        images: [],
        _count: { variants: 2, reviews: 1 },
        variants: [{ stock: 4 }, { stock: 6 }],
      },
    ]
    vi.mocked(prisma.$transaction).mockResolvedValue([products, 1] as never)

    const result = await listAdminProducts({ page: 1, limit: 20 })

    expect(result.products[0]).toMatchObject({ basePrice: 10, totalStock: 10 })
    expect(result.meta).toMatchObject({ total: 1, totalPages: 1 })
  })

  it('applies search, category and boolean filters', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
    await listAdminProducts({
      page: 1,
      limit: 20,
      search: 'tee',
      categoryId: 'c1',
      isActive: true,
      isFeatured: false,
    })
    const call = vi.mocked(prisma.product.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[]; categoryId?: string; isActive?: boolean }
    }
    expect(call.where.categoryId).toBe('c1')
    expect(call.where.isActive).toBe(true)
    expect(call.where.OR).toHaveLength(2)
  })
})
