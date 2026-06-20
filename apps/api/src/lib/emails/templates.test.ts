import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSendEmail, mockCanSend } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockCanSend: vi.fn(() => true),
}))

vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail, canSendEmail: mockCanSend }))
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }))

import { sendEmailVerification } from './email-verification'
import { sendOrderConfirmationEmail } from './order-confirmation'
import { sendPasswordResetEmail } from './password-reset'
import { sendPaymentActionRequiredEmail } from './payment-action-required'

interface SentEmail {
  to: string
  subject: string
  html: string
  text?: string
}

function lastEmail(): SentEmail {
  return mockSendEmail.mock.calls.at(-1)?.[0] as SentEmail
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCanSend.mockReturnValue(true)
})

describe('sendEmailVerification', () => {
  it('embeds the verification URL in both html and text', async () => {
    const url = 'https://shop.example.com/auth/verify-email?token=abc123'
    await sendEmailVerification({
      userId: 'u1',
      customerEmail: 'a@b.com',
      customerName: 'Ada',
      verificationUrl: url,
    })
    const email = lastEmail()
    expect(email.to).toBe('a@b.com')
    expect(email.subject).toMatch(/verify/i)
    expect(email.html).toContain(url)
    expect(email.html).toContain('Hi Ada,')
    expect(email.text).toContain(url)
  })

  it('falls back to a generic greeting without a name', async () => {
    await sendEmailVerification({
      userId: 'u1',
      customerEmail: 'a@b.com',
      verificationUrl: 'https://x/y',
    })
    expect(lastEmail().html).toContain('Hi there,')
  })

  it('skips sending when email is not configured', async () => {
    mockCanSend.mockReturnValue(false)
    await sendEmailVerification({ userId: 'u1', customerEmail: 'a@b.com', verificationUrl: 'x' })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})

describe('sendOrderConfirmationEmail', () => {
  const data = {
    orderId: 'order-12345678',
    customerEmail: 'a@b.com',
    customerName: 'Ada',
    items: [{ productName: 'Tee', variantName: 'Red / M', quantity: 2, price: '29.99' }],
    subtotal: '59.98',
    shippingCost: '5.00',
    tax: '3.60',
    discountAmount: '10.00',
    total: '58.58',
    couponCode: 'SAVE10',
    shippingAddress: {
      line1: '1 Main St',
      city: 'London',
      state: 'LDN',
      postalCode: 'EC1',
      country: 'GB',
    },
  }

  it('formats currency, shows the discount row, and uses the short order id in the subject', async () => {
    await sendOrderConfirmationEmail(data)
    const email = lastEmail()
    expect(email.subject).toContain('#12345678')
    expect(email.html).toContain('$58.58') // total
    expect(email.html).toContain('SAVE10') // coupon in the discount row
    expect(email.html).toContain('Tee') // line item
    expect(email.text).toContain('Order ID: order-12345678')
  })

  it('omits the discount row when there is no discount', async () => {
    await sendOrderConfirmationEmail({ ...data, discountAmount: '0.00', couponCode: null })
    expect(lastEmail().html).not.toContain('Discount')
  })
})

describe('sendPasswordResetEmail', () => {
  it('includes the reset URL and a reset subject', async () => {
    const url = 'https://shop.example.com/auth/reset-password?token=xyz'
    await sendPasswordResetEmail({
      userId: 'u1',
      customerEmail: 'a@b.com',
      customerName: 'Ada',
      resetUrl: url,
    })
    const email = lastEmail()
    expect(email.subject).toMatch(/reset/i)
    expect(email.html).toContain(url)
    expect(email.text).toContain(url)
  })
})

describe('sendPaymentActionRequiredEmail', () => {
  it('references the order and asks the customer to complete authentication', async () => {
    await sendPaymentActionRequiredEmail({
      orderId: 'order-12345678',
      customerEmail: 'a@b.com',
      customerName: 'Ada',
    })
    const email = lastEmail()
    expect(email.subject).toContain('#12345678')
    expect(email.html).toMatch(/verification|authentication/i)
    expect(email.text).toContain('order-12345678')
  })
})
