import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockEnv, mockSend, mockLogger } = vi.hoisted(() => ({
  mockEnv: { RESEND_API_KEY: 'test-key' as string | undefined, EMAIL_FROM: 'shop@example.com' },
  mockSend: vi.fn(),
  mockLogger: { info: vi.fn(), error: vi.fn() },
}))

vi.mock('@/config/env', () => ({ env: mockEnv }))
vi.mock('@/lib/logger', () => ({ logger: mockLogger }))
vi.mock('resend', () => ({ Resend: vi.fn(() => ({ emails: { send: mockSend } })) }))

import { sendEmail, canSendEmail } from './email'

beforeEach(() => {
  vi.clearAllMocks()
  mockEnv.RESEND_API_KEY = 'test-key'
})

describe('canSendEmail', () => {
  it('is true when an API key is configured', () => {
    expect(canSendEmail()).toBe(true)
  })

  it('is false when no API key is configured', () => {
    mockEnv.RESEND_API_KEY = undefined
    expect(canSendEmail()).toBe(false)
  })
})

describe('sendEmail', () => {
  it('sends through Resend with the configured from address', async () => {
    mockSend.mockResolvedValue({ error: null })
    await sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>x</p>', text: 'x' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'shop@example.com',
        to: 'a@b.com',
        subject: 'Hi',
        html: '<p>x</p>',
        text: 'x',
      })
    )
    expect(mockLogger.info).toHaveBeenCalledWith('Email sent', expect.anything())
  })

  it('throws and logs when Resend returns an error', async () => {
    mockSend.mockResolvedValue({ error: { message: 'rejected' } })
    await expect(sendEmail({ to: 'a@b.com', subject: 's', html: 'h' })).rejects.toThrow('rejected')
    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('throws when the API key is not configured', async () => {
    mockEnv.RESEND_API_KEY = undefined
    vi.resetModules()
    const fresh = await import('./email')
    await expect(fresh.sendEmail({ to: 'a@b.com', subject: 's', html: 'h' })).rejects.toThrow(
      /RESEND_API_KEY/
    )
  })
})
