import { describe, it, expect, vi } from 'vitest'
import type { Response } from 'express'
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from './response'

function mockRes() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
}

describe('buildPaginationMeta', () => {
  it('computes totalPages and next/prev flags for a middle page', () => {
    expect(buildPaginationMeta(25, 2, 10)).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    })
  })

  it('handles an empty result set', () => {
    expect(buildPaginationMeta(0, 1, 10)).toMatchObject({
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    })
  })

  it('handles a single full page', () => {
    expect(buildPaginationMeta(10, 1, 10)).toMatchObject({
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })
  })
})

describe('sendSuccess', () => {
  it('wraps data in a success envelope with the default 200', () => {
    const res = mockRes()
    sendSuccess(res, { a: 1 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { a: 1 } })
  })

  it('includes meta when provided and honours a custom status', () => {
    const res = mockRes()
    sendSuccess(res, [1], 207, { total: 1 })
    expect(res.status).toHaveBeenCalledWith(207)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [1], meta: { total: 1 } })
  })
})

describe('sendCreated', () => {
  it('responds with 201', () => {
    const res = mockRes()
    sendCreated(res, { id: 'x' })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'x' } })
  })
})

describe('sendPaginated', () => {
  it('sends a data array with pagination meta at 200', () => {
    const res = mockRes()
    const meta = buildPaginationMeta(1, 1, 10)
    sendPaginated(res, [{ id: 'x' }], meta)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'x' }], meta })
  })
})
