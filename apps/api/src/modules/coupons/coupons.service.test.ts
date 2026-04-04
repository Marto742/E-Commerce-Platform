import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  listCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from './coupons.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const mockCoupon = {
  id: 'coupon-1',
  code: 'SAVE10',
  type: 'FIXED_AMOUNT',
  value: '10.00',
  minOrderAmount: null,
  maxUses: null,
  usesCount: 0,
  isActive: true,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── listCoupons ──────────────────────────────────────────────────────────────

describe('listCoupons', () => {
  it('returns paginated coupons', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockCoupon], 1] as never)
    const result = await listCoupons({ page: 1, limit: 20 })
    expect(result.coupons).toEqual([mockCoupon])
    expect(result.meta.total).toBe(1)
  })
})

// ─── getCouponById ────────────────────────────────────────────────────────────

describe('getCouponById', () => {
  it('returns the coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon as never)
    const result = await getCouponById('coupon-1')
    expect(result).toEqual(mockCoupon)
  })

  it('throws notFound when coupon does not exist', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)
    await expect(getCouponById('missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── createCoupon ─────────────────────────────────────────────────────────────

describe('createCoupon', () => {
  const input = {
    code: 'SAVE10',
    type: 'FIXED_AMOUNT' as const,
    value: 10,
    isActive: true,
  }

  it('creates and returns the coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null) // no conflict
    vi.mocked(prisma.coupon.create).mockResolvedValue(mockCoupon as never)
    const result = await createCoupon(input)
    expect(result).toEqual(mockCoupon)
  })

  it('throws conflict when code already exists', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon as never)
    await expect(createCoupon(input)).rejects.toMatchObject({ statusCode: 409 })
  })
})

// ─── updateCoupon ─────────────────────────────────────────────────────────────

describe('updateCoupon', () => {
  it('updates and returns the coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon as never)
    vi.mocked(prisma.coupon.update).mockResolvedValue({ ...mockCoupon, isActive: false } as never)
    const result = await updateCoupon('coupon-1', { isActive: false })
    expect(result).toMatchObject({ isActive: false })
  })

  it('throws notFound when coupon does not exist', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)
    await expect(updateCoupon('missing', { isActive: false })).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws conflict when new code is already taken', async () => {
    vi.mocked(prisma.coupon.findUnique)
      .mockResolvedValueOnce(mockCoupon as never) // own record
      .mockResolvedValueOnce({ ...mockCoupon, id: 'other-id', code: 'NEW10' } as never) // conflict
    await expect(updateCoupon('coupon-1', { code: 'NEW10' })).rejects.toMatchObject({
      statusCode: 409,
    })
  })
})

// ─── deleteCoupon ─────────────────────────────────────────────────────────────

describe('deleteCoupon', () => {
  it('deletes the coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon as never)
    vi.mocked(prisma.coupon.delete).mockResolvedValue(mockCoupon as never)
    await expect(deleteCoupon('coupon-1')).resolves.toBeUndefined()
  })

  it('throws notFound when coupon does not exist', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)
    await expect(deleteCoupon('missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── validateCoupon ───────────────────────────────────────────────────────────

describe('validateCoupon', () => {
  it('returns discount amount for a valid FIXED_AMOUNT coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon as never)
    const result = await validateCoupon('SAVE10', 50)
    expect(result.discountAmount).toBe(10)
    expect(result.discountLabel).toBe('$10.00 off')
  })

  it('returns discount amount for a PERCENTAGE coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...mockCoupon,
      type: 'PERCENTAGE',
      value: '20.00',
    } as never)
    const result = await validateCoupon('SAVE20', 100)
    expect(result.discountAmount).toBe(20)
    expect(result.discountLabel).toBe('20% off')
  })

  it('caps FIXED_AMOUNT discount at subtotal', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon as never) // $10 off
    const result = await validateCoupon('SAVE10', 5) // subtotal only $5
    expect(result.discountAmount).toBe(5)
  })

  it('throws COUPON_INVALID for unknown code', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)
    await expect(validateCoupon('BOGUS', 50)).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })

  it('throws COUPON_INVALID for inactive coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...mockCoupon,
      isActive: false,
    } as never)
    await expect(validateCoupon('SAVE10', 50)).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })

  it('throws COUPON_INVALID for expired coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...mockCoupon,
      expiresAt: new Date('2000-01-01'),
    } as never)
    await expect(validateCoupon('SAVE10', 50)).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })

  it('throws COUPON_INVALID when usage limit reached', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...mockCoupon,
      maxUses: 5,
      usesCount: 5,
    } as never)
    await expect(validateCoupon('SAVE10', 50)).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })

  it('throws COUPON_INVALID when subtotal is below minimum order amount', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...mockCoupon,
      minOrderAmount: '100.00',
    } as never)
    await expect(validateCoupon('SAVE10', 50)).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })
})
