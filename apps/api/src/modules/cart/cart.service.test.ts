import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { addItem, updateItem, removeItem, clearCart, getCart } from './cart.service'
import type { CartIdentifier } from './cart.service'
import { AppError } from '@/utils/AppError'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cart: {
      upsert: vi.fn(),
    },
    cartItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
  },
}))

const userIdentifier: CartIdentifier = { userId: 'user-1' }
const sessionIdentifier: CartIdentifier = { sessionId: 'sess-abc' }

const mockVariant = {
  id: 'var-1',
  sku: 'SKU-001',
  name: 'Default',
  price: 9.99,
  stock: 50,
  isActive: true,
  productId: 'prod-1',
}

const mockCart = {
  id: 'cart-1',
  userId: 'user-1',
  sessionId: null,
  items: [],
}

const mockCartWithItem = {
  ...mockCart,
  items: [
    {
      id: 'item-1',
      cartId: 'cart-1',
      variantId: 'var-1',
      quantity: 2,
      variant: {
        ...mockVariant,
        product: { id: 'prod-1', name: 'Widget', slug: 'widget', images: [] },
      },
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getCart ──────────────────────────────────────────────────────────────────

describe('getCart', () => {
  it('returns or creates cart for user', async () => {
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    const result = await getCart(userIdentifier)
    expect(prisma.cart.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
    expect(result).toEqual(mockCart)
  })

  it('returns or creates cart for session', async () => {
    vi.mocked(prisma.cart.upsert).mockResolvedValue({
      ...mockCart,
      userId: null,
      sessionId: 'sess-abc',
    } as never)
    const result = await getCart(sessionIdentifier)
    expect(prisma.cart.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sessionId: 'sess-abc' } })
    )
    expect(result).toMatchObject({ sessionId: 'sess-abc' })
  })
})

// ─── addItem ──────────────────────────────────────────────────────────────────

describe('addItem', () => {
  it('adds new item to cart', async () => {
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(mockVariant as never)
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.cartItem.create).mockResolvedValue({} as never)
    // Second upsert call returns updated cart
    vi.mocked(prisma.cart.upsert)
      .mockResolvedValueOnce(mockCart as never)
      .mockResolvedValueOnce(mockCartWithItem as never)

    const result = await addItem(userIdentifier, 'var-1', 2)
    expect(prisma.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ variantId: 'var-1', quantity: 2 }),
      })
    )
    expect(result).toEqual(mockCartWithItem)
  })

  it('updates quantity when item already in cart', async () => {
    const existingItem = { id: 'item-1', cartId: 'cart-1', variantId: 'var-1', quantity: 3 }
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(mockVariant as never)
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(existingItem as never)
    vi.mocked(prisma.cartItem.update).mockResolvedValue({} as never)

    await addItem(userIdentifier, 'var-1', 2)
    // existing 3 + new 2 = 5
    expect(prisma.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: 5 } })
    )
  })

  it('throws notFound when variant does not exist or is inactive', async () => {
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(null)
    await expect(addItem(userIdentifier, 'missing', 1)).rejects.toMatchObject({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
    })
  })

  it('throws INSUFFICIENT_STOCK when quantity exceeds stock', async () => {
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
      ...mockVariant,
      stock: 2,
    } as never)
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null)
    await expect(addItem(userIdentifier, 'var-1', 5)).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    })
  })

  it('throws INSUFFICIENT_STOCK when existing + new quantity exceeds stock', async () => {
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
      ...mockVariant,
      stock: 4,
    } as never)
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findUnique).mockResolvedValue({
      id: 'item-1',
      quantity: 3,
    } as never)
    await expect(addItem(userIdentifier, 'var-1', 3)).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    })
  })

  it('throws notFound when variant is inactive', async () => {
    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
      ...mockVariant,
      isActive: false,
    } as never)
    await expect(addItem(userIdentifier, 'var-1', 1)).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── updateItem ───────────────────────────────────────────────────────────────

describe('updateItem', () => {
  it('updates item quantity', async () => {
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue({
      id: 'item-1',
      variant: { stock: 50 },
    } as never)
    vi.mocked(prisma.cartItem.update).mockResolvedValue({} as never)

    await updateItem(userIdentifier, 'item-1', 5)
    expect(prisma.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'item-1' }, data: { quantity: 5 } })
    )
  })

  it('throws notFound when item does not belong to cart', async () => {
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null)
    await expect(updateItem(userIdentifier, 'missing', 1)).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws INSUFFICIENT_STOCK when quantity exceeds available stock', async () => {
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue({
      id: 'item-1',
      variant: { stock: 3 },
    } as never)
    await expect(updateItem(userIdentifier, 'item-1', 10)).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    })
  })
})

// ─── removeItem ───────────────────────────────────────────────────────────────

describe('removeItem', () => {
  it('removes item from cart', async () => {
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue({ id: 'item-1' } as never)
    vi.mocked(prisma.cartItem.delete).mockResolvedValue({} as never)

    await removeItem(userIdentifier, 'item-1')
    expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } })
  })

  it('throws notFound when item does not belong to cart', async () => {
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null)
    await expect(removeItem(userIdentifier, 'missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── clearCart ────────────────────────────────────────────────────────────────

describe('clearCart', () => {
  it('deletes all items in cart', async () => {
    vi.mocked(prisma.cart.upsert).mockResolvedValue(mockCart as never)
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 2 } as never)

    await clearCart(userIdentifier)
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } })
  })
})
