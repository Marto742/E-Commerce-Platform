import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back</p>
      </div>

      {/* Stat cards — wired to GET /admin/analytics/overview in Phase 7 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: '—', sub: 'this month' },
          { label: 'Orders', value: '—', sub: 'this month' },
          { label: 'Customers', value: '—', sub: 'total' },
          { label: 'Products', value: '—', sub: 'active' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
