import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/server-fetch'
import { CouponForm } from '@/components/coupons/coupon-form'
import { updateCouponAction } from '../../actions'

export const metadata: Metadata = { title: 'Edit Coupon' }

interface Coupon {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: string
  minOrderAmount: string | null
  maxUses: number | null
  usesCount: number
  isActive: boolean
  expiresAt: string | null
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCouponPage({ params }: Props) {
  const { id } = await params

  let coupon: Coupon
  try {
    const res = await serverFetch<{ data: Coupon }>(`/coupons/${id}`)
    coupon = res.data
  } catch {
    notFound()
  }

  // Format date to YYYY-MM-DD for the date input
  const expiresAtDate = coupon.expiresAt
    ? new Date(coupon.expiresAt).toISOString().split('T')[0]
    : ''

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/coupons" className="text-sm text-slate-500 hover:text-slate-700">
          ← Coupons
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">Edit — {coupon.code}</h1>
      </div>

      {coupon.usesCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This coupon has been used {coupon.usesCount} time{coupon.usesCount !== 1 ? 's' : ''}.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CouponForm
          initial={{
            code: coupon.code,
            type: coupon.type,
            value: Number(coupon.value),
            minOrderAmount: coupon.minOrderAmount ? String(Number(coupon.minOrderAmount)) : '',
            maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
            expiresAt: expiresAtDate,
            isActive: coupon.isActive,
          }}
          action={(data) => updateCouponAction(id, data)}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  )
}
