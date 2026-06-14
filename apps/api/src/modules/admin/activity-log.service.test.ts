import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { logActivity, listActivityLogs } from './activity-log.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    activityLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('logActivity', () => {
  it('persists an activity record with the given fields', async () => {
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as never)

    logActivity('admin-1', 'product.create', 'product', 'prod-1', { name: 'X' })
    await Promise.resolve() // flush the fire-and-forget microtask

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: 'admin-1',
        action: 'product.create',
        entity: 'product',
        entityId: 'prod-1',
      }),
    })
  })

  it('uses null entityId when omitted', async () => {
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as never)
    logActivity('admin-1', 'order.refund', 'order')
    await Promise.resolve()
    const call = vi.mocked(prisma.activityLog.create).mock.calls[0]![0] as {
      data: { entityId: unknown }
    }
    expect(call.data.entityId).toBeNull()
  })

  it('never throws when the write fails (fire-and-forget)', async () => {
    vi.mocked(prisma.activityLog.create).mockRejectedValue(new Error('db down'))
    expect(() => logActivity('admin-1', 'x', 'y')).not.toThrow()
    await Promise.resolve()
  })
})

describe('listActivityLogs', () => {
  it('returns logs with pagination meta and applies filters', async () => {
    const logs = [{ id: 'log-1' }]
    vi.mocked(prisma.$transaction).mockResolvedValue([logs, 1] as never)

    const result = await listActivityLogs({ page: 1, limit: 20, entity: 'product', adminId: 'a1' })

    expect(result.logs).toEqual(logs)
    expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 20, totalPages: 1 })
    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { entity: 'product', adminId: 'a1' } })
    )
  })

  it('builds an empty where clause when no filters are passed', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
    await listActivityLogs({ page: 2, limit: 10 })
    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, skip: 10, take: 10 })
    )
  })
})
