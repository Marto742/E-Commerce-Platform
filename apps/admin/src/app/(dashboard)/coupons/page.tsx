import type { Metadata } from 'next'
import Link from 'next/link'
import { serverFetch } from '@/lib/server-fetch'
import { DeleteCouponButton } from './delete-button'

export const metadata: Metadata = { title: 'Coupons' }

// ─── Types ────────────────────────────────────────────────────────────────────

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
  createdAt: string
}

interface ListResponse {
  data: Coupon[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CouponsPage() {
  let coupons: Coupon[] = []
  let total = 0
  try {
    const res = await serverFetch<ListResponse>('/coupons?limit=100')
    coupons = res.data
    total = res.meta.total
  } catch {
    // handled below
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
          <p className="text-sm text-slate-500">{total} total</p>
        </div>
        <Link
          href="/coupons/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add Coupon
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {coupons.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-400">
            No coupons yet. Create one to get started.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-600">Code</th>
                <th className="px-4 py-3 font-medium text-slate-600">Discount</th>
                <th className="px-4 py-3 font-medium text-slate-600">Min. Order</th>
                <th className="px-4 py-3 font-medium text-slate-600">Uses</th>
                <th className="px-4 py-3 font-medium text-slate-600">Expires</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-slate-900">{coupon.code}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {coupon.type === 'PERCENTAGE'
                      ? `${Number(coupon.value)}% off`
                      : `$${Number(coupon.value).toFixed(2)} off`}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {coupon.minOrderAmount ? `$${Number(coupon.minOrderAmount).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {coupon.usesCount}
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        coupon.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/coupons/${coupon.id}/edit`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      <DeleteCouponButton id={coupon.id} code={coupon.code} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
