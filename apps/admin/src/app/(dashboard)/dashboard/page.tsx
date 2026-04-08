import type { Metadata } from 'next'
import { serverFetch } from '@/lib/server-fetch'
import { StatCard } from '@/components/dashboard/stat-card'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
  revenue: { thisMonth: number; lastMonth: number; change: number }
  orders: { thisMonth: number; lastMonth: number; change: number }
  customers: { total: number }
  products: { active: number }
  recentOrders: Array<{
    id: string
    status: string
    total: number
    createdAt: string
    _count: { items: number }
    user: { firstName: string; lastName: string; email: string } | null
  }>
  orderStatusBreakdown: Array<{ status: string; count: number }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-indigo-50 text-indigo-700',
  SHIPPED: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

const STATUS_ORDER = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  let overview: OverviewData | null = null
  let fetchError = false

  try {
    const res = await serverFetch<{ data: OverviewData }>('/admin/analytics/overview')
    overview = res.data
  } catch {
    fetchError = true
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Store overview</p>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load analytics data. Make sure the API is running.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={overview ? formatCurrency(overview.revenue.thisMonth) : '—'}
          sub="this month"
          change={overview?.revenue.change ?? null}
        />
        <StatCard
          label="Orders"
          value={overview ? String(overview.orders.thisMonth) : '—'}
          sub="this month"
          change={overview?.orders.change ?? null}
        />
        <StatCard
          label="Customers"
          value={overview ? String(overview.customers.total) : '—'}
          sub="total registered"
        />
        <StatCard
          label="Products"
          value={overview ? String(overview.products.active) : '—'}
          sub="active listings"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {overview && overview.recentOrders.length > 0 ? (
                overview.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest'}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {order.user?.email ?? ''} · {order._count.items} item
                        {order._count.items !== 1 ? 's' : ''} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-5 py-6 text-center text-sm text-slate-400">
                  {overview ? 'No orders yet.' : '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Orders by Status</h2>
          </div>
          <div className="px-5 py-4">
            {overview && overview.orderStatusBreakdown.length > 0 ? (
              <ul className="space-y-3">
                {[...overview.orderStatusBreakdown]
                  .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
                  .map(({ status, count }) => {
                    const total = overview.orderStatusBreakdown.reduce((s, x) => s + x.count, 0)
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                      <li key={status}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </span>
                          <span className="text-slate-500">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">
                {overview ? 'No orders yet.' : '—'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
