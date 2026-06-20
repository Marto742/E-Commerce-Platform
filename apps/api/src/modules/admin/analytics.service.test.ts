import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { getOverview } from './analytics.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    user: { count: vi.fn() },
    product: { count: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getOverview', () => {
  it('aggregates revenue/orders with percentage change and shapes the response', async () => {
    const recentOrders = [
      {
        id: 'o1',
        status: 'DELIVERED',
        total: '99.50', // Prisma Decimal serializes as a string
        createdAt: new Date('2026-06-10'),
        _count: { items: 2 },
        user: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      },
    ]
    const statusBreakdown = [
      { status: 'PENDING', _count: 3 },
      { status: 'DELIVERED', _count: 7 },
    ]

    vi.mocked(prisma.$transaction).mockResolvedValue([
      { _sum: { total: 1000 } }, // revenueThis
      { _sum: { total: 500 } }, // revenueLast
      10, // ordersThis
      5, // ordersLast
      42, // totalCustomers
      7, // activeProducts
      recentOrders,
      statusBreakdown,
    ] as never)

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ day: new Date('2026-06-01T00:00:00Z'), revenue: 100 }] as never)
      .mockResolvedValueOnce([{ day: new Date('2026-06-01T00:00:00Z'), count: 4 }] as never)

    const result = await getOverview()

    expect(result.revenue).toEqual({ thisMonth: 1000, lastMonth: 500, change: 100 })
    expect(result.orders).toEqual({ thisMonth: 10, lastMonth: 5, change: 100 })
    expect(result.customers).toEqual({ total: 42 })
    expect(result.products).toEqual({ active: 7 })
    expect(result.recentOrders[0]).toMatchObject({ id: 'o1', total: 99.5 })
    expect(result.orderStatusBreakdown).toEqual([
      { status: 'PENDING', count: 3 },
      { status: 'DELIVERED', count: 7 },
    ])
    expect(result.dailyRevenue).toEqual([{ day: '2026-06-01', revenue: 100 }])
    expect(result.dailyOrders).toEqual([{ day: '2026-06-01', count: 4 }])
  })

  it('reports 100% growth from a zero baseline and 0 sums when null', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { _sum: { total: null } }, // revenueThis (no orders)
      { _sum: { total: null } }, // revenueLast
      3, // ordersThis
      0, // ordersLast
      0,
      0,
      [],
      [],
    ] as never)
    vi.mocked(prisma.$queryRaw).mockResolvedValue([] as never)

    const result = await getOverview()

    expect(result.revenue).toEqual({ thisMonth: 0, lastMonth: 0, change: 0 })
    expect(result.orders.change).toBe(100) // 3 vs 0 -> 100%
  })
})
