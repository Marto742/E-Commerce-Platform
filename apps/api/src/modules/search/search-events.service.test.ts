import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { recordSearchEvent } from './search-events.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    searchEvent: {
      create: vi.fn(),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('recordSearchEvent', () => {
  it('records a normalized, trimmed event', async () => {
    vi.mocked(prisma.searchEvent.create).mockResolvedValue({} as never)

    recordSearchEvent({ query: '  Running Shoes  ', resultCount: 5, userId: 'user-1' })
    await Promise.resolve()

    expect(prisma.searchEvent.create).toHaveBeenCalledWith({
      data: {
        query: 'Running Shoes',
        normalized: 'running shoes',
        resultCount: 5,
        userId: 'user-1',
      },
    })
  })

  it('defaults userId to null for anonymous searches', async () => {
    vi.mocked(prisma.searchEvent.create).mockResolvedValue({} as never)
    recordSearchEvent({ query: 'hat', resultCount: 0 })
    await Promise.resolve()
    const call = vi.mocked(prisma.searchEvent.create).mock.calls[0]![0] as {
      data: { userId: unknown }
    }
    expect(call.data.userId).toBeNull()
  })

  it('skips empty / whitespace-only queries', () => {
    recordSearchEvent({ query: '   ', resultCount: 0 })
    expect(prisma.searchEvent.create).not.toHaveBeenCalled()
  })

  it('never throws when the write fails (best-effort analytics)', async () => {
    vi.mocked(prisma.searchEvent.create).mockRejectedValue(new Error('db down'))
    expect(() => recordSearchEvent({ query: 'x', resultCount: 1 })).not.toThrow()
    await Promise.resolve()
  })
})
