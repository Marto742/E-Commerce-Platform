import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { listCustomers } from './customers.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listCustomers', () => {
  it('returns customers with pagination meta', async () => {
    const customers = [{ id: 'c1' }, { id: 'c2' }]
    vi.mocked(prisma.$transaction).mockResolvedValue([customers, 2] as never)

    const result = await listCustomers({ page: 1, limit: 20 })

    expect(result.customers).toEqual(customers)
    expect(result.meta).toMatchObject({ total: 2, page: 1, limit: 20, totalPages: 1 })
  })

  it('always filters to the CUSTOMER role and defaults to createdAt desc', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
    await listCustomers({ page: 1, limit: 20 })
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: 'CUSTOMER' }),
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('builds a case-insensitive OR search across email/first/last name', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
    await listCustomers({ page: 1, limit: 20, search: 'ada' })
    const call = vi.mocked(prisma.user.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[] }
    }
    expect(call.where.OR).toHaveLength(3)
  })

  it('applies the status filter and custom sort', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
    await listCustomers({
      page: 1,
      limit: 20,
      status: 'SUSPENDED',
      sortBy: 'email',
      sortOrder: 'asc',
    })
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'SUSPENDED' }),
        orderBy: { email: 'asc' },
      })
    )
  })
})
