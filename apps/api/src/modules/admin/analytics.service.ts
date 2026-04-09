import { prisma } from '@/lib/prisma'

const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export async function getOverview() {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    revenueThis,
    revenueLast,
    ordersThis,
    ordersLast,
    totalCustomers,
    activeProducts,
    recentOrders,
    statusBreakdown,
  ] = await prisma.$transaction([
    prisma.order.aggregate({
      where: {
        status: { in: REVENUE_STATUSES as unknown as never[] },
        createdAt: { gte: thisMonthStart },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: REVENUE_STATUSES as unknown as never[] },
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.order.count({
      where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.order.groupBy({
      by: ['status'],
      orderBy: { status: 'asc' },
      _count: true,
    }),
  ])

  // Daily revenue + order counts for charts (last 30 days) — requires raw SQL for date truncation
  const [dailyRevenue, dailyOrders] = await Promise.all([
    prisma.$queryRaw<Array<{ day: Date; revenue: number }>>`
      SELECT
        DATE_TRUNC('day', created_at) AS day,
        SUM(total)::float             AS revenue
      FROM orders
      WHERE
        created_at >= ${thirtyDaysAgo}
        AND status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY day ASC
    `,
    prisma.$queryRaw<Array<{ day: Date; count: number }>>`
      SELECT
        DATE_TRUNC('day', created_at) AS day,
        COUNT(*)::int                 AS count
      FROM orders
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY day ASC
    `,
  ])

  const thisRevenue = Number(revenueThis._sum.total ?? 0)
  const lastRevenue = Number(revenueLast._sum.total ?? 0)

  return {
    revenue: {
      thisMonth: thisRevenue,
      lastMonth: lastRevenue,
      change: pct(thisRevenue, lastRevenue),
    },
    orders: {
      thisMonth: ordersThis,
      lastMonth: ordersLast,
      change: pct(ordersThis, ordersLast),
    },
    customers: { total: totalCustomers },
    products: { active: activeProducts },
    recentOrders: recentOrders.map((o) => ({
      ...o,
      total: Number(o.total),
    })),
    orderStatusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    dailyRevenue: dailyRevenue.map((d) => ({
      day: d.day.toISOString().slice(0, 10),
      revenue: d.revenue,
    })),
    dailyOrders: dailyOrders.map((d) => ({
      day: d.day.toISOString().slice(0, 10),
      count: d.count,
    })),
  }
}
