import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import { buildPaginationMeta } from '@/utils/response'
import type { CreateReviewInput, UpdateReviewInput, ReviewQueryInput } from '@repo/validation'

// ─── Shared selects ───────────────────────────────────────────────────────────

const USER_SELECT = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
  },
} as const

const PRODUCT_SELECT = {
  select: {
    id: true,
    name: true,
    slug: true,
    images: {
      take: 1,
      orderBy: { sortOrder: 'asc' as const },
      select: { url: true, altText: true },
    },
  },
} as const

// ─── List product reviews (public) ───────────────────────────────────────────

export async function listProductReviews(productId: string, query: ReviewQueryInput) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  })
  if (!product) throw AppError.notFound('Product not found')

  const { page, limit, rating, verified, sortBy = 'createdAt', sortOrder = 'desc' } = query
  const skip = (page - 1) * limit

  const where = {
    productId,
    ...(rating !== undefined && { rating }),
    ...(verified !== undefined && { isVerifiedPurchase: verified === 'true' }),
  }

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { user: USER_SELECT },
    }),
    prisma.review.count({ where }),
  ])

  return { reviews, meta: buildPaginationMeta(total, page, limit) }
}

// ─── Rating summary for a product ────────────────────────────────────────────

export async function getProductRatingSummary(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  })
  if (!product) throw AppError.notFound('Product not found')

  const ratings = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  })

  const count = ratings.length
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  if (count === 0) return { average: null, count: 0, distribution }

  let sum = 0
  for (const { rating } of ratings) {
    distribution[rating] = (distribution[rating] ?? 0) + 1
    sum += rating
  }

  return {
    average: Math.round((sum / count) * 10) / 10,
    count,
    distribution,
  }
}

// ─── Get single review ────────────────────────────────────────────────────────

export async function getReviewById(id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: USER_SELECT,
      product: PRODUCT_SELECT,
    },
  })
  if (!review) throw AppError.notFound('Review not found')
  return review
}

// ─── List authenticated user's reviews ───────────────────────────────────────

export async function listMyReviews(userId: string, query: ReviewQueryInput) {
  const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = query
  const skip = (page - 1) * limit
  const where = { userId }

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { product: PRODUCT_SELECT },
    }),
    prisma.review.count({ where }),
  ])

  return { reviews, meta: buildPaginationMeta(total, page, limit) }
}

// ─── Create review ────────────────────────────────────────────────────────────

export async function createReview(userId: string, data: CreateReviewInput) {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true },
  })
  if (!product) throw AppError.notFound('Product not found')

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId: data.productId } },
    select: { id: true },
  })
  if (existing) throw AppError.conflict('You have already reviewed this product')

  // A "verified purchase" means the user has a DELIVERED order containing this product
  const verifiedOrderItem = await prisma.orderItem.findFirst({
    where: {
      variant: { productId: data.productId },
      order: { userId, status: 'DELIVERED' },
    },
    select: { id: true },
  })

  return prisma.review.create({
    data: {
      userId,
      productId: data.productId,
      rating: data.rating,
      title: data.title,
      body: data.body,
      isVerifiedPurchase: verifiedOrderItem !== null,
    },
    include: {
      user: USER_SELECT,
      product: PRODUCT_SELECT,
    },
  })
}

// ─── Update review ────────────────────────────────────────────────────────────

export async function updateReview(userId: string, reviewId: string, data: UpdateReviewInput) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  })
  if (!review) throw AppError.notFound('Review not found')
  if (review.userId !== userId) throw AppError.forbidden('You can only edit your own reviews')

  return prisma.review.update({
    where: { id: reviewId },
    data,
    include: {
      user: USER_SELECT,
      product: PRODUCT_SELECT,
    },
  })
}

// ─── Delete review ────────────────────────────────────────────────────────────

export async function deleteReview(userId: string, reviewId: string, asAdmin: boolean) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  })
  if (!review) throw AppError.notFound('Review not found')
  if (!asAdmin && review.userId !== userId)
    throw AppError.forbidden('You can only delete your own reviews')

  await prisma.review.delete({ where: { id: reviewId } })
}
