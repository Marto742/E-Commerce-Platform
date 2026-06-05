import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { getSearchAnalytics } from './search-analytics.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    searchEvent: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSearchAnalytics', () => {
  it('aggregates summary, top queries, and zero-result queries', async () => {
    vi.mocked(prisma.searchEvent.count)
      .mockResolvedValueOnce(10 as never) // totalSearches
      .mockResolvedValueOnce(2 as never) // zeroResultSearches
    vi.mocked(prisma.searchEvent.groupBy)
      .mockResolvedValueOnce([
        { normalized: 'iphone', _count: { normalized: 5 }, _avg: { resultCount: 3.25 } },
        { normalized: 'laptop', _count: { normalized: 3 }, _avg: { resultCount: 1 } },
      ] as never)
      .mockResolvedValueOnce([{ normalized: 'xyzzy', _count: { normalized: 2 } }] as never)
    vi.mocked(prisma.searchEvent.findMany).mockResolvedValue([
      { normalized: 'iphone' },
      { normalized: 'laptop' },
      { normalized: 'xyzzy' },
    ] as never)

    const result = await getSearchAnalytics(30)

    expect(result.periodDays).toBe(30)
    expect(result.summary).toEqual({
      totalSearches: 10,
      uniqueQueries: 3,
      zeroResultSearches: 2,
      zeroResultRate: 20,
    })
    expect(result.topQueries[0]).toEqual({ query: 'iphone', count: 5, avgResults: 3.3 })
    expect(result.zeroResultQueries).toEqual([{ query: 'xyzzy', count: 2 }])
  })

  it('reports a zero rate when there are no searches', async () => {
    vi.mocked(prisma.searchEvent.count).mockResolvedValue(0 as never)
    vi.mocked(prisma.searchEvent.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.searchEvent.findMany).mockResolvedValue([] as never)

    const result = await getSearchAnalytics(7)

    expect(result.summary.totalSearches).toBe(0)
    expect(result.summary.zeroResultRate).toBe(0)
    expect(result.topQueries).toEqual([])
  })
})
