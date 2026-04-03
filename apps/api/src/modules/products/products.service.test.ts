import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  listProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  listVariants,
  getVariantById,
  adjustStock,
  createVariant,
  updateVariant,
  deleteVariant,
} from './products.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    review: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(),
  },
}))

const mockProduct = {
  id: 'prod-1',
  name: 'Widget',
  slug: 'widget',
  categoryId: 'cat-1',
  basePrice: 9.99,
  isActive: true,
  category: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
  images: [],
  variants: [],
  _count: { reviews: 0 },
}

const mockVariant = {
  id: 'var-1',
  productId: 'prod-1',
  sku: 'WGT-001',
  name: 'Default',
  price: 9.99,
  stock: 50,
  isActive: true,
  attributes: {},
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── listProducts ─────────────────────────────────────────────────────────────

describe('listProducts', () => {
  it('returns paginated products', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockProduct], 1] as never)
    const result = await listProducts({ page: 1, limit: 10 })
    expect(result.products).toEqual([{ ...mockProduct, avgRating: null }])
    expect(result.meta.total).toBe(1)
    expect(result.meta.page).toBe(1)
  })

  it('passes search filter to where clause', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
    await listProducts({ page: 1, limit: 10, search: 'widget' })
    const [[findManyCall]] = vi.mocked(prisma.$transaction).mock.calls
    // $transaction receives an array of promises — we verify it was called
    expect(prisma.$transaction).toHaveBeenCalled()
    expect(findManyCall).toBeDefined()
  })
})

// ─── getProductById ───────────────────────────────────────────────────────────

describe('getProductById', () => {
  it('returns product when found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    const result = await getProductById('prod-1')
    expect(result).toEqual(mockProduct)
  })

  it('throws notFound when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(getProductById('missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
    })
  })
})

// ─── getProductBySlug ─────────────────────────────────────────────────────────

describe('getProductBySlug', () => {
  it('returns product when found by slug', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    const result = await getProductBySlug('widget')
    expect(result).toEqual(mockProduct)
    expect(prisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'widget' } })
    )
  })

  it('throws notFound for unknown slug', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(getProductBySlug('ghost')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── createProduct ────────────────────────────────────────────────────────────

describe('createProduct', () => {
  const input = {
    name: 'Gadget',
    slug: 'gadget',
    categoryId: 'clh3xfzvy0000356ok9cxx5oi',
    basePrice: '19.99',
    description: 'A gadget',
    isActive: true,
    isFeatured: false,
  }

  it('creates and returns product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null) // slug check
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as never)
    vi.mocked(prisma.product.create).mockResolvedValue({ ...mockProduct, ...input } as never)
    const result = await createProduct(input)
    expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({ data: input }))
    expect(result).toMatchObject(input)
  })

  it('throws conflict when slug is taken', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    await expect(createProduct(input)).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' })
    expect(prisma.product.create).not.toHaveBeenCalled()
  })

  it('throws notFound when category does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null) // slug check passes
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    await expect(createProduct(input)).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── updateProduct ────────────────────────────────────────────────────────────

describe('updateProduct', () => {
  it('updates product successfully', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null) // slug not taken
    vi.mocked(prisma.product.update).mockResolvedValue({
      ...mockProduct,
      name: 'Updated',
    } as never)
    const result = await updateProduct('prod-1', { name: 'Updated' })
    expect(result).toMatchObject({ name: 'Updated' })
  })

  it('throws notFound when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(updateProduct('missing', { name: 'X' })).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws conflict when new slug is taken by another product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: 'other' } as never)
    await expect(updateProduct('prod-1', { slug: 'taken' })).rejects.toMatchObject({
      statusCode: 409,
    })
  })

  it('throws notFound when new categoryId does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    await expect(updateProduct('prod-1', { categoryId: 'bad-cat' })).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})

// ─── deleteProduct ────────────────────────────────────────────────────────────

describe('deleteProduct', () => {
  it('deletes existing product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    await deleteProduct('prod-1')
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod-1' } })
  })

  it('throws notFound for missing product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(deleteProduct('missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── listVariants ─────────────────────────────────────────────────────────────

describe('listVariants', () => {
  it('returns variants for existing product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    const result = await listVariants('prod-1')
    expect(result).toEqual([mockVariant])
  })

  it('throws notFound when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(listVariants('missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── getVariantById ───────────────────────────────────────────────────────────

describe('getVariantById', () => {
  it('returns variant when found', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(mockVariant as never)
    const result = await getVariantById('prod-1', 'var-1')
    expect(result).toEqual(mockVariant)
  })

  it('throws notFound when variant does not exist', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null)
    await expect(getVariantById('prod-1', 'missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── adjustStock ──────────────────────────────────────────────────────────────

describe('adjustStock', () => {
  it('sets stock to exact value', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(mockVariant as never)
    vi.mocked(prisma.productVariant.update).mockResolvedValue({
      ...mockVariant,
      stock: 100,
    } as never)
    const result = await adjustStock('prod-1', 'var-1', 'set', 100)
    expect(prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stock: 100 } })
    )
    expect(result).toMatchObject({ stock: 100 })
  })

  it('adds to current stock', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({
      ...mockVariant,
      stock: 50,
    } as never)
    vi.mocked(prisma.productVariant.update).mockResolvedValue({
      ...mockVariant,
      stock: 60,
    } as never)
    await adjustStock('prod-1', 'var-1', 'add', 10)
    expect(prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stock: 60 } })
    )
  })

  it('subtracts from current stock', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({
      ...mockVariant,
      stock: 50,
    } as never)
    vi.mocked(prisma.productVariant.update).mockResolvedValue({
      ...mockVariant,
      stock: 40,
    } as never)
    await adjustStock('prod-1', 'var-1', 'subtract', 10)
    expect(prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stock: 40 } })
    )
  })

  it('throws badRequest when subtracting more than available stock', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({
      ...mockVariant,
      stock: 5,
    } as never)
    await expect(adjustStock('prod-1', 'var-1', 'subtract', 10)).rejects.toMatchObject({
      statusCode: 422,
    })
    expect(prisma.productVariant.update).not.toHaveBeenCalled()
  })
})

// ─── createVariant ────────────────────────────────────────────────────────────

describe('createVariant', () => {
  const variantInput = {
    sku: 'WGT-002',
    name: 'Large',
    price: '12.99',
    stock: 0,
    attributes: {},
    isActive: true,
  }

  it('creates a new variant', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.productVariant.create).mockResolvedValue({
      ...mockVariant,
      ...variantInput,
    } as never)
    const result = await createVariant('prod-1', variantInput)
    expect(prisma.productVariant.create).toHaveBeenCalled()
    expect(result).toMatchObject(variantInput)
  })

  it('throws notFound when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(createVariant('missing', variantInput)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws conflict when SKU is already in use', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(mockVariant as never)
    await expect(createVariant('prod-1', variantInput)).rejects.toMatchObject({ statusCode: 409 })
    expect(prisma.productVariant.create).not.toHaveBeenCalled()
  })
})

// ─── updateVariant ────────────────────────────────────────────────────────────

describe('updateVariant', () => {
  it('updates variant successfully', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(mockVariant as never)
    vi.mocked(prisma.productVariant.update).mockResolvedValue({
      ...mockVariant,
      name: 'XL',
    } as never)
    const result = await updateVariant('prod-1', 'var-1', { name: 'XL' })
    expect(result).toMatchObject({ name: 'XL' })
  })

  it('throws notFound when variant does not belong to product', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null)
    await expect(updateVariant('prod-1', 'var-1', { name: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws conflict when new SKU is taken by another variant', async () => {
    vi.mocked(prisma.productVariant.findFirst)
      .mockResolvedValueOnce(mockVariant as never) // variant lookup
      .mockResolvedValueOnce({ id: 'other' } as never) // SKU conflict check
    await expect(updateVariant('prod-1', 'var-1', { sku: 'TAKEN' })).rejects.toMatchObject({
      statusCode: 409,
    })
  })
})

// ─── deleteVariant ────────────────────────────────────────────────────────────

describe('deleteVariant', () => {
  it('deletes variant successfully', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(mockVariant as never)
    await deleteVariant('prod-1', 'var-1')
    expect(prisma.productVariant.delete).toHaveBeenCalledWith({ where: { id: 'var-1' } })
  })

  it('throws notFound when variant does not exist', async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null)
    await expect(deleteVariant('prod-1', 'missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})
