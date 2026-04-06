import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import type { CreateAddressInput, UpdateAddressInput } from '@repo/validation'

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function createAddress(userId: string, data: CreateAddressInput) {
  return prisma.$transaction(async (tx) => {
    // If new address is default, unset existing defaults first
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
    }

    // First address for this user is always default
    const count = await tx.address.count({ where: { userId } })
    const isDefault = data.isDefault ?? count === 0

    return tx.address.create({ data: { ...data, userId, isDefault } })
  })
}

export async function updateAddress(id: string, userId: string, data: UpdateAddressInput) {
  const existing = await prisma.address.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('Address not found')
  if (existing.userId !== userId) throw AppError.forbidden()

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    return tx.address.update({ where: { id }, data })
  })
}

export async function deleteAddress(id: string, userId: string) {
  const existing = await prisma.address.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('Address not found')
  if (existing.userId !== userId) throw AppError.forbidden()

  await prisma.address.delete({ where: { id } })

  // If deleted address was default, promote the oldest remaining one
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } })
  }
}

export async function setDefault(id: string, userId: string) {
  const existing = await prisma.address.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('Address not found')
  if (existing.userId !== userId) throw AppError.forbidden()

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ])
}
