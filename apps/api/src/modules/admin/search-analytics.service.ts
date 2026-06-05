import { prisma } from '@/lib/prisma'

/**
 * Aggregated search analytics for the admin panel over the last `days` days:
 * volume, unique terms, zero-result rate, and the top / most-failed queries.
 */
export async function getSearchAnalytics(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const where = { createdAt: { gte: since } }

  const [totalSearches, zeroResultSearches, topQueries, zeroResultQueries, distinctRows] =
    await Promise.all([
      prisma.searchEvent.count({ where }),
      prisma.searchEvent.count({ where: { ...where, resultCount: 0 } }),
      prisma.searchEvent.groupBy({
        by: ['normalized'],
        where,
        _count: { normalized: true },
        _avg: { resultCount: true },
        orderBy: { _count: { normalized: 'desc' } },
        take: 20,
      }),
      prisma.searchEvent.groupBy({
        by: ['normalized'],
        where: { ...where, resultCount: 0 },
        _count: { normalized: true },
        orderBy: { _count: { normalized: 'desc' } },
        take: 20,
      }),
      prisma.searchEvent.findMany({
        where,
        distinct: ['normalized'],
        select: { normalized: true },
      }),
    ])

  return {
    periodDays: days,
    summary: {
      totalSearches,
      uniqueQueries: distinctRows.length,
      zeroResultSearches,
      zeroResultRate: totalSearches
        ? Math.round((zeroResultSearches / totalSearches) * 1000) / 10
        : 0,
    },
    topQueries: topQueries.map((row) => ({
      query: row.normalized,
      count: row._count.normalized,
      avgResults: Math.round((row._avg.resultCount ?? 0) * 10) / 10,
    })),
    zeroResultQueries: zeroResultQueries.map((row) => ({
      query: row.normalized,
      count: row._count.normalized,
    })),
  }
}
