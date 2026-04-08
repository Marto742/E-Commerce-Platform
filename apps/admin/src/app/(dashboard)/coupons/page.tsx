import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Coupons' }

export default function CouponsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
      <p className="mt-4 text-sm text-slate-500">Coupons — implemented in Phase 11</p>
    </div>
  )
}
