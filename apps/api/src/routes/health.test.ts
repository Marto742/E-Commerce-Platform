import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

const app = createApp()

describe('GET /v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/v1/health')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('ok')
    expect(res.body.data).toHaveProperty('timestamp')
    expect(res.body.data).toHaveProperty('uptime')
  })

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/v1/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND')
  })
})
