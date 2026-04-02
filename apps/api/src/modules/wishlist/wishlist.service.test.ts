import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { getWishlist, addItem, removeItem, clearWishlist, isWishlisted } from './wishlist.service'
import { AppError } from '@/utils/AppError'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    wishlist: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    wishlistItem: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  },
}))

const mockWishlist = {
  id: 'wl-1',
  userId: 'user-1',
  items: [],
  _count: { items: 0 },
}

const mockProduct = { id: 'prod-1', isActive: true }

const mockItem = {
  id: 'wli-1',
  wishlistId: 'wl-1',
  productId: 'prod-1',
  product: {
    id: 'prod-1',
    name: 'Widget',
    slug: 'widget',
    basePrice: 9.99,
    comparePrice: null,
    isActive: true,
    images: [],
    _count: { variants: 1 },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getWishlist ──────────────────────────────────────────────────────────────

describe('getWishlist', () => {
  it('returns wishlist with items', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue({
      ...mockWishlist,
      items: [mockItem],
      _count: { items: 1 },
    } as never)
    const result = await getWishlist('user-1')
    expect(result.items).toHaveLength(1)
  })

  it('returns empty wishlist shape when none exists for user', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue(null)
    const result = await getWishlist('user-1')
    expect(result).toEqual({ id: null, userId: 'user-1', items: [], _count: { items: 0 } })
  })
})

// ─── addItem ──────────────────────────────────────────────────────────────────

describe('addItem', () => {
  it('adds product to wishlist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.wishlist.upsert).mockResolvedValue({ id: 'wl-1' } as never)
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.wishlistItem.create).mockResolvedValue(mockItem as never)

    const result = await addItem('user-1', { productId: 'prod-1' })
    expect(prisma.wishlistItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ productId: 'prod-1', wishlistId: 'wl-1' }),
      })
    )
    expect(result).toEqual(mockItem)
  })

  it('throws notFound when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(addItem('user-1', { productId: 'missing' })).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws badRequest when product is inactive', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      ...mockProduct,
      isActive: false,
    } as never)
    await expect(addItem('user-1', { productId: 'prod-1' })).rejects.toMatchObject({
      statusCode: 422,
    })
  })

  it('throws conflict when product is already wishlisted', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.wishlist.upsert).mockResolvedValue({ id: 'wl-1' } as never)
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({ id: 'wli-1' } as never)
    await expect(addItem('user-1', { productId: 'prod-1' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    })
    expect(prisma.wishlistItem.create).not.toHaveBeenCalled()
  })
})

// ─── removeItem ───────────────────────────────────────────────────────────────

describe('removeItem', () => {
  it('removes product from wishlist', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue({ id: 'wl-1' } as never)
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({ id: 'wli-1' } as never)
    await removeItem('user-1', 'prod-1')
    expect(prisma.wishlistItem.delete).toHaveBeenCalledWith({ where: { id: 'wli-1' } })
  })

  it('throws notFound when wishlist does not exist', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue(null)
    await expect(removeItem('user-1', 'prod-1')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws notFound when product is not in wishlist', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue({ id: 'wl-1' } as never)
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue(null)
    await expect(removeItem('user-1', 'prod-1')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── clearWishlist ────────────────────────────────────────────────────────────

describe('clearWishlist', () => {
  it('deletes all items in wishlist', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue({ id: 'wl-1' } as never)
    vi.mocked(prisma.wishlistItem.deleteMany).mockResolvedValue({ count: 3 } as never)
    await clearWishlist('user-1')
    expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
      where: { wishlistId: 'wl-1' },
    })
  })

  it('returns without error when wishlist does not exist', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue(null)
    await expect(clearWishlist('user-1')).resolves.toBeUndefined()
    expect(prisma.wishlistItem.deleteMany).not.toHaveBeenCalled()
  })
})

// ─── isWishlisted ─────────────────────────────────────────────────────────────

describe('isWishlisted', () => {
  it('returns true when product is in wishlist', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue({ id: 'wl-1' } as never)
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({ id: 'wli-1' } as never)
    const result = await isWishlisted('user-1', 'prod-1')
    expect(result).toBe(true)
  })

  it('returns false when product is not in wishlist', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue({ id: 'wl-1' } as never)
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue(null)
    const result = await isWishlisted('user-1', 'prod-1')
    expect(result).toBe(false)
  })

  it('returns false when user has no wishlist', async () => {
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue(null)
    const result = await isWishlisted('user-1', 'prod-1')
    expect(result).toBe(false)
  })
})
