import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  listProductReviews,
  getProductRatingSummary,
  getReviewById,
  listMyReviews,
  createReview,
  updateReview,
  deleteReview,
} from './reviews.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    orderItem: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const mockProduct = { id: 'prod-1' }

const mockReview = {
  id: 'rev-1',
  userId: 'user-1',
  productId: 'prod-1',
  rating: 5,
  title: 'Great product',
  body: 'Really enjoyed it',
  isVerifiedPurchase: false,
  user: { id: 'user-1', firstName: 'Alice', lastName: 'Smith', avatarUrl: null },
  product: { id: 'prod-1', name: 'Widget', slug: 'widget', images: [] },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── listProductReviews ───────────────────────────────────────────────────────

describe('listProductReviews', () => {
  it('returns paginated reviews for a product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockReview], 1] as never)
    const result = await listProductReviews('prod-1', { page: 1, limit: 10 })
    expect(result.reviews).toEqual([mockReview])
    expect(result.meta.total).toBe(1)
  })

  it('throws notFound when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(listProductReviews('missing', { page: 1, limit: 10 })).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})

// ─── getProductRatingSummary ──────────────────────────────────────────────────

describe('getProductRatingSummary', () => {
  it('returns average, count and distribution', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.review.findMany).mockResolvedValue([
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
    ] as never)

    const result = await getProductRatingSummary('prod-1')
    expect(result.count).toBe(3)
    expect(result.average).toBe(4.7) // (5+4+5)/3 = 4.666... → rounded to 4.7
    expect(result.distribution[5]).toBe(2)
    expect(result.distribution[4]).toBe(1)
  })

  it('returns null average when no reviews exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.review.findMany).mockResolvedValue([] as never)
    const result = await getProductRatingSummary('prod-1')
    expect(result.average).toBeNull()
    expect(result.count).toBe(0)
  })

  it('throws notFound when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(getProductRatingSummary('missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── getReviewById ────────────────────────────────────────────────────────────

describe('getReviewById', () => {
  it('returns review when found', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue(mockReview as never)
    const result = await getReviewById('rev-1')
    expect(result).toEqual(mockReview)
  })

  it('throws notFound when review does not exist', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue(null)
    await expect(getReviewById('missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── listMyReviews ────────────────────────────────────────────────────────────

describe('listMyReviews', () => {
  it('returns paginated reviews for the user', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockReview], 1] as never)
    const result = await listMyReviews('user-1', { page: 1, limit: 10 })
    expect(result.reviews).toEqual([mockReview])
    expect(result.meta.total).toBe(1)
  })
})

// ─── createReview ─────────────────────────────────────────────────────────────

describe('createReview', () => {
  const reviewInput = { productId: 'prod-1', rating: 5, title: 'Great', body: 'Loved it' }

  it('creates a review (unverified) when no delivered order exists', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.review.findUnique).mockResolvedValue(null) // no existing review
    vi.mocked(prisma.orderItem.findFirst).mockResolvedValue(null) // no delivered order
    vi.mocked(prisma.review.create).mockResolvedValue(mockReview as never)

    const result = await createReview('user-1', reviewInput)
    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isVerifiedPurchase: false }),
      })
    )
    expect(result).toEqual(mockReview)
  })

  it('creates a verified review when a delivered order exists', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.review.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.orderItem.findFirst).mockResolvedValue({ id: 'oi-1' } as never)
    vi.mocked(prisma.review.create).mockResolvedValue({
      ...mockReview,
      isVerifiedPurchase: true,
    } as never)

    await createReview('user-1', reviewInput)
    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isVerifiedPurchase: true }),
      })
    )
  })

  it('throws notFound when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    await expect(createReview('user-1', reviewInput)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws conflict when user already reviewed the product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never)
    vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: 'rev-1' } as never)
    await expect(createReview('user-1', reviewInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    })
    expect(prisma.review.create).not.toHaveBeenCalled()
  })
})

// ─── updateReview ─────────────────────────────────────────────────────────────

describe('updateReview', () => {
  it('updates review for its author', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: 'rev-1',
      userId: 'user-1',
    } as never)
    vi.mocked(prisma.review.update).mockResolvedValue({
      ...mockReview,
      title: 'Updated',
    } as never)

    const result = await updateReview('user-1', 'rev-1', { title: 'Updated' })
    expect(result).toMatchObject({ title: 'Updated' })
  })

  it('throws notFound when review does not exist', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue(null)
    await expect(updateReview('user-1', 'missing', { title: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws forbidden when user does not own the review', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: 'rev-1',
      userId: 'other-user',
    } as never)
    await expect(updateReview('user-1', 'rev-1', { title: 'X' })).rejects.toMatchObject({
      statusCode: 403,
    })
  })
})

// ─── deleteReview ─────────────────────────────────────────────────────────────

describe('deleteReview', () => {
  it('allows user to delete their own review', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: 'rev-1',
      userId: 'user-1',
    } as never)
    await deleteReview('user-1', 'rev-1', false)
    expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 'rev-1' } })
  })

  it('allows admin to delete any review', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: 'rev-1',
      userId: 'other-user',
    } as never)
    await deleteReview('admin-1', 'rev-1', true)
    expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 'rev-1' } })
  })

  it('throws notFound when review does not exist', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue(null)
    await expect(deleteReview('user-1', 'missing', false)).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws forbidden when non-owner non-admin tries to delete', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: 'rev-1',
      userId: 'other-user',
    } as never)
    await expect(deleteReview('user-1', 'rev-1', false)).rejects.toMatchObject({
      statusCode: 403,
    })
    expect(prisma.review.delete).not.toHaveBeenCalled()
  })
})
