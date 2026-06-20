import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiFetch, api, ApiError } from '../api-client'

const fetchMock = vi.fn()

function res(
  body: unknown,
  init: Partial<{ ok: boolean; status: number; statusText: string }> = {}
) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: async () => body,
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('admin apiFetch', () => {
  it('returns parsed JSON and sends a JSON content-type header', async () => {
    fetchMock.mockResolvedValue(res({ ok: true }))
    const data = await apiFetch('/admin/customers')
    expect(data).toEqual({ ok: true })
    const [url, opts] = fetchMock.mock.calls[0]!
    expect(url).toContain('/v1/admin/customers')
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })

  it('appends defined query params and skips null/undefined', async () => {
    fetchMock.mockResolvedValue(res({}))
    await apiFetch('/admin/products', {
      params: { search: 'tee', page: 2, skip: undefined, none: null },
    })
    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain('search=tee')
    expect(url).toContain('page=2')
    expect(url).not.toContain('skip')
    expect(url).not.toContain('none')
  })

  it('serialises a JSON body and sets the method via api.post', async () => {
    fetchMock.mockResolvedValue(res({ id: 'x' }))
    await api.post('/admin/products/import', { rows: [] })
    const opts = fetchMock.mock.calls[0]![1]
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe(JSON.stringify({ rows: [] }))
  })

  it('throws an ApiError with the server code/message on failure', async () => {
    fetchMock.mockResolvedValue(
      res({ error: { code: 'FORBIDDEN', message: 'no' } }, { ok: false, status: 403 })
    )
    await expect(apiFetch('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      code: 'FORBIDDEN',
      message: 'no',
    })
  })

  it('falls back to defaults when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => {
        throw new Error('not json')
      },
    })
    const err = await apiFetch('/x').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).code).toBe('UNKNOWN_ERROR')
    expect((err as ApiError).message).toBe('Server Error')
  })

  it('returns undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(res(null, { status: 204 }))
    await expect(api.delete('/admin/x')).resolves.toBeUndefined()
  })

  it('exposes get/patch/put/delete helpers with the right method', async () => {
    fetchMock.mockResolvedValue(res({}))
    await api.get('/x')
    await api.patch('/x', { a: 1 })
    await api.put('/x', { a: 1 })
    expect(fetchMock.mock.calls[0]![1].method).toBe('GET')
    expect(fetchMock.mock.calls[1]![1].method).toBe('PATCH')
    expect(fetchMock.mock.calls[2]![1].method).toBe('PUT')
  })
})
