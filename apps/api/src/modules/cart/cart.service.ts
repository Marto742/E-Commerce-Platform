import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'

export type CartIdentifier = { userId: string } | { sessionId: string }

// Full cart shape returned to the client
const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              comparePrice: true,
              images: {
                take: 1,
                orderBy: { sortOrder: 'asc' as const },
                select: { url: true, altText: true },
              },
            },
          },
        },
      },
    },
  },
} as const

async function getOrCreateCart(identifier: CartIdentifier) {
  if ('userId' in identifier) {
    return prisma.cart.upsert({
      where: { userId: identifier.userId },
      create: { userId: identifier.userId },
      update: {},
      include: CART_INCLUDE,
    })
  }
  return prisma.cart.upsert({
    where: { sessionId: identifier.sessionId },
    create: { sessionId: identifier.sessionId },
    update: {},
    include: CART_INCLUDE,
  })
}

export async function getCart(identifier: CartIdentifier) {
  return getOrCreateCart(identifier)
}

export async function addItem(identifier: CartIdentifier, variantId: string, quantity: number) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  })
  if (!variant || !variant.isActive) throw AppError.notFound('Product variant not found')

  const cart = await getOrCreateCart(identifier)

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  })

  const newQuantity = (existing?.quantity ?? 0) + quantity

  if (variant.stock < newQuantity)
    throw new AppError(409, 'INSUFFICIENT_STOCK', `Only ${variant.stock} unit(s) available`)

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity },
    })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId, quantity },
    })
  }

  return getOrCreateCart(identifier)
}

export async function updateItem(identifier: CartIdentifier, itemId: string, quantity: number) {
  const cart = await getOrCreateCart(identifier)

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { variant: true },
  })
  if (!item) throw AppError.notFound('Cart item not found')

  if (item.variant.stock < quantity)
    throw new AppError(409, 'INSUFFICIENT_STOCK', `Only ${item.variant.stock} unit(s) available`)

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })

  return getOrCreateCart(identifier)
}

export async function removeItem(identifier: CartIdentifier, itemId: string) {
  const cart = await getOrCreateCart(identifier)

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  })
  if (!item) throw AppError.notFound('Cart item not found')

  await prisma.cartItem.delete({ where: { id: itemId } })

  return getOrCreateCart(identifier)
}

export async function clearCart(identifier: CartIdentifier) {
  const cart = await getOrCreateCart(identifier)
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  return getOrCreateCart(identifier)
}
