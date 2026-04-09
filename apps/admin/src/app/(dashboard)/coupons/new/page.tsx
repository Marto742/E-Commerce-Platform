import type { Metadata } from 'next'
import Link from 'next/link'
import { CouponForm } from '@/components/coupons/coupon-form'
import { createCouponAction } from '../actions'

export const metadata: Metadata = { title: 'New Coupon' }

export default function NewCouponPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/coupons" className="text-sm text-slate-500 hover:text-slate-700">
          ← Coupons
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">New Coupon</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CouponForm action={createCouponAction} submitLabel="Create Coupon" />
      </div>
    </div>
  )
}
