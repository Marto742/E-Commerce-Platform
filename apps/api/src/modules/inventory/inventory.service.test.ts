import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  listInventory,
  listLowStock,
  getStockSummary,
  getVariantBySku,
  bulkUpdateStock,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from './inventory.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    productVariant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const mockVariant = {
  id: 'var-1',
  sku: 'SKU-001',
  name: 'Default',
  stock: 25,
  isActive: true,
  productId: 'prod-1',
  product: {
    id: 'prod-1',
    name: 'Widget',
    slug: 'widget',
    isActive: true,
    images: [],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── listInventory ────────────────────────────────────────────────────────────

describe('listInventory', () => {
  it('returns paginated variant list', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockVariant], 1] as never)
    const result = await listInventory({ page: 1, limit: 20 })
    expect(result.variants).toEqual([mockVariant])
    expect(result.meta.total).toBe(1)
  })

  it('passes filters through to the query', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
    await listInventory({ page: 1, limit: 20, search: 'sku', minStock: 5, maxStock: 50 })
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

// ─── listLowStock ─────────────────────────────────────────────────────────────

describe('listLowStock', () => {
  it('returns variants at or below default threshold', async () => {
    const lowVariant = { ...mockVariant, stock: 3 }
    vi.mocked(prisma.$transaction).mockResolvedValue([[lowVariant], 1] as never)
    const result = await listLowStock()
    expect(result.variants).toEqual([lowVariant])
  })

  it('uses a custom threshold when provided', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
    await listLowStock(5)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

// ─── getStockSummary ──────────────────────────────────────────────────────────

describe('getStockSummary', () => {
  it('returns total, outOfStock, lowStock counts', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([100, 5, 12] as never)
    const result = await getStockSummary()
    expect(result).toEqual({
      total: 100,
      outOfStock: 5,
      lowStock: 12,
      threshold: DEFAULT_LOW_STOCK_THRESHOLD,
    })
  })
})

// ─── getVariantBySku ──────────────────────────────────────────────────────────

describe('getVariantBySku', () => {
  it('returns variant for a known SKU', async () => {
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(mockVariant as never)
    const result = await getVariantBySku('SKU-001')
    expect(result).toEqual(mockVariant)
    expect(prisma.productVariant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sku: 'SKU-001' } })
    )
  })

  it('throws notFound for an unknown SKU', async () => {
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(null)
    await expect(getVariantBySku('GHOST')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── bulkUpdateStock ──────────────────────────────────────────────────────────

describe('bulkUpdateStock', () => {
  it('applies set, add and subtract operations in one transaction', async () => {
    const varA = { id: 'var-a', sku: 'A', stock: 10 }
    const varB = { id: 'var-b', sku: 'B', stock: 20 }
    const varC = { id: 'var-c', sku: 'C', stock: 30 }

    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([varA, varB, varC] as never)
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { id: 'var-a', stock: 5 },
      { id: 'var-b', stock: 25 },
      { id: 'var-c', stock: 25 },
    ] as never)

    const result = await bulkUpdateStock([
      { variantId: 'var-a', operation: 'set', quantity: 5 },
      { variantId: 'var-b', operation: 'add', quantity: 5 },
      { variantId: 'var-c', operation: 'subtract', quantity: 5 },
    ])

    expect(result).toEqual([
      { id: 'var-a', stock: 5 },
      { id: 'var-b', stock: 25 },
      { id: 'var-c', stock: 25 },
    ])
  })

  it('throws badRequest when a variant ID does not exist', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([] as never)
    await expect(
      bulkUpdateStock([{ variantId: 'missing', operation: 'set', quantity: 10 }])
    ).rejects.toMatchObject({ statusCode: 422 })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('throws badRequest when subtract would result in negative stock', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
      { id: 'var-1', sku: 'SKU-001', stock: 3 },
    ] as never)
    await expect(
      bulkUpdateStock([{ variantId: 'var-1', operation: 'subtract', quantity: 10 }])
    ).rejects.toMatchObject({ statusCode: 422 })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
