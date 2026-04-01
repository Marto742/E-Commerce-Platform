import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import type { AddToWishlistInput } from '@repo/validation'

// ─── Shared include ───────────────────────────────────────────────────────────

const ITEM_WITH_PRODUCT = {
  include: {
    product: {
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        comparePrice: true,
        isActive: true,
        images: {
          take: 1,
          orderBy: { sortOrder: 'asc' as const },
          select: { url: true, altText: true },
        },
        _count: { select: { variants: true } },
      },
    },
  },
} as const

// ─── Get or create wishlist ───────────────────────────────────────────────────

async function getOrCreate(userId: string) {
  return prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  })
}

// ─── Get wishlist with items ──────────────────────────────────────────────────

export async function getWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        ...ITEM_WITH_PRODUCT,
      },
      _count: { select: { items: true } },
    },
  })

  // Return empty wishlist shape when none exists yet
  if (!wishlist) return { id: null, userId, items: [], _count: { items: 0 } }
  return wishlist
}

// ─── Add item ─────────────────────────────────────────────────────────────────

export async function addItem(userId: string, data: AddToWishlistInput) {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true, isActive: true },
  })
  if (!product) throw AppError.notFound('Product not found')
  if (!product.isActive) throw AppError.badRequest('Product is not available')

  const wishlist = await getOrCreate(userId)

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId: data.productId } },
    select: { id: true },
  })
  if (existing) throw AppError.conflict('Product is already in your wishlist')

  return prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId: data.productId },
    ...ITEM_WITH_PRODUCT,
  })
}

// ─── Remove item ──────────────────────────────────────────────────────────────

export async function removeItem(userId: string, productId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!wishlist) throw AppError.notFound('Wishlist not found')

  const item = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    select: { id: true },
  })
  if (!item) throw AppError.notFound('Product not found in wishlist')

  await prisma.wishlistItem.delete({ where: { id: item.id } })
}

// ─── Clear wishlist ───────────────────────────────────────────────────────────

export async function clearWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!wishlist) return // Nothing to clear

  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } })
}

// ─── Check if product is wishlisted ──────────────────────────────────────────

export async function isWishlisted(userId: string, productId: string): Promise<boolean> {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!wishlist) return false

  const item = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    select: { id: true },
  })
  return item !== null
}
