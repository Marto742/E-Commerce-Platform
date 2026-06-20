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

describe('apiFetch', () => {
  it('returns parsed JSON and sends default headers', async () => {
    fetchMock.mockResolvedValue(res({ ok: true }))
    const data = await apiFetch('/products')
    expect(data).toEqual({ ok: true })
    const [url, opts] = fetchMock.mock.calls[0]!
    expect(url).toContain('/v1/products')
    expect(opts.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    })
  })

  it('appends defined query params and skips null/undefined', async () => {
    fetchMock.mockResolvedValue(res({}))
    await apiFetch('/products', { params: { q: 'shirt', page: 2, skip: undefined, none: null } })
    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain('q=shirt')
    expect(url).toContain('page=2')
    expect(url).not.toContain('skip')
    expect(url).not.toContain('none')
  })

  it('adds a Bearer Authorization header when accessToken is provided', async () => {
    fetchMock.mockResolvedValue(res({}))
    await apiFetch('/orders', { accessToken: 'tok123' })
    expect(fetchMock.mock.calls[0]![1].headers).toMatchObject({ Authorization: 'Bearer tok123' })
  })

  it('serialises a JSON body and sets the method via api.post', async () => {
    fetchMock.mockResolvedValue(res({ id: 'x' }))
    await api.post('/cart/items', { variantId: 'v1', quantity: 2 })
    const opts = fetchMock.mock.calls[0]![1]
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe(JSON.stringify({ variantId: 'v1', quantity: 2 }))
  })

  it('throws an ApiError with the server-provided code/message on failure', async () => {
    fetchMock.mockResolvedValue(
      res({ error: { code: 'RESOURCE_NOT_FOUND', message: 'nope' } }, { ok: false, status: 404 })
    )
    await expect(apiFetch('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
      message: 'nope',
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
    await expect(apiFetch('/cart/items/1')).resolves.toBeUndefined()
  })

  it('exposes delete/patch/put/get helpers with the right method', async () => {
    fetchMock.mockResolvedValue(res({}))
    await api.delete('/cart')
    await api.get('/cart')
    expect(fetchMock.mock.calls[0]![1].method).toBe('DELETE')
    expect(fetchMock.mock.calls[1]![1].method).toBe('GET')
  })
})
