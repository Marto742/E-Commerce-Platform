import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {} as Record<string, string | undefined>,
}))

vi.mock('@/config/env', () => ({ env: mockEnv }))
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation((cfg: unknown) => ({ cfg })),
}))

import { getR2Client, getPublicUrl } from './r2'
import { S3Client } from '@aws-sdk/client-s3'

beforeEach(() => {
  vi.clearAllMocks()
  for (const k of Object.keys(mockEnv)) delete mockEnv[k]
})

describe('getR2Client', () => {
  it('returns null when R2 is not configured', () => {
    expect(getR2Client()).toBeNull()
  })

  it('returns null when only some R2 vars are set', () => {
    mockEnv.R2_ACCOUNT_ID = 'acct'
    expect(getR2Client()).toBeNull()
  })

  it('constructs an S3 client pointed at the R2 endpoint when fully configured', () => {
    Object.assign(mockEnv, {
      R2_ACCOUNT_ID: 'acct',
      R2_ACCESS_KEY_ID: 'key',
      R2_SECRET_ACCESS_KEY: 'secret',
      R2_BUCKET_NAME: 'bucket',
    })
    const client = getR2Client()
    expect(client).not.toBeNull()
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'auto',
        endpoint: 'https://acct.r2.cloudflarestorage.com',
        credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
      })
    )
  })
})

describe('getPublicUrl', () => {
  it('joins the public base and key, stripping a trailing slash', () => {
    mockEnv.R2_PUBLIC_URL = 'https://cdn.example.com/'
    expect(getPublicUrl('img/a.png')).toBe('https://cdn.example.com/img/a.png')
  })

  it('falls back to a relative path when no base is configured', () => {
    expect(getPublicUrl('a.png')).toBe('/a.png')
  })
})
