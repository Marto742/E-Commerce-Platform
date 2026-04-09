import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { buildPaginationMeta } from '@/utils/response'
import { paginationSchema } from '@repo/validation'

export const adminCustomerQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['UNVERIFIED', 'ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  sortBy: z.enum(['createdAt', 'email', 'firstName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type AdminCustomerQueryInput = z.infer<typeof adminCustomerQuerySchema>

export async function listCustomers(query: AdminCustomerQueryInput) {
  const { page, limit, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query

  const skip = (page - 1) * limit

  const where = {
    role: 'CUSTOMER' as const,
    ...(status && { status }),
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [customers, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    customers,
    meta: buildPaginationMeta(total, page, limit),
  }
}
