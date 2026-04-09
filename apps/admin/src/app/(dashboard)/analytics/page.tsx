import type { Metadata } from 'next'
import { serverFetch } from '@/lib/server-fetch'
import { StatCard } from '@/components/dashboard/stat-card'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { OrdersChart } from '@/components/analytics/orders-chart'
import { StatusChart } from '@/components/analytics/status-chart'

export const metadata: Metadata = { title: 'Analytics' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  revenue: { thisMonth: number; lastMonth: number; change: number }
  orders: { thisMonth: number; lastMonth: number; change: number }
  customers: { total: number }
  products: { active: number }
  orderStatusBreakdown: Array<{ status: string; count: number }>
  dailyRevenue: Array<{ day: string; revenue: number }>
  dailyOrders: Array<{ day: string; count: number }>
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  let data: AnalyticsData | null = null
  let fetchError = false

  try {
    const res = await serverFetch<{ data: AnalyticsData }>('/admin/analytics/overview')
    data = res.data
  } catch {
    fetchError = true
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Sales and revenue — last 30 days</p>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load analytics data. Make sure the API is running.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={data ? formatCurrency(data.revenue.thisMonth) : '—'}
          sub="this month"
          change={data?.revenue.change ?? null}
        />
        <StatCard
          label="Orders"
          value={data ? String(data.orders.thisMonth) : '—'}
          sub="this month"
          change={data?.orders.change ?? null}
        />
        <StatCard
          label="Customers"
          value={data ? String(data.customers.total) : '—'}
          sub="total registered"
        />
        <StatCard
          label="Products"
          value={data ? String(data.products.active) : '—'}
          sub="active listings"
        />
      </div>

      {/* Charts row 1 */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue trend */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Daily Revenue</h2>
            <p className="text-xs text-slate-400">Last 30 days · confirmed orders only</p>
          </div>
          <div className="px-4 py-4">
            <RevenueChart data={data?.dailyRevenue ?? []} />
          </div>
        </div>

        {/* Orders volume */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Daily Orders</h2>
            <p className="text-xs text-slate-400">Last 30 days · all statuses</p>
          </div>
          <div className="px-4 py-4">
            <OrdersChart data={data?.dailyOrders ?? []} />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status breakdown donut */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Orders by Status</h2>
            <p className="text-xs text-slate-400">All time</p>
          </div>
          <div className="px-4 py-4">
            <StatusChart data={data?.orderStatusBreakdown ?? []} />
          </div>
        </div>

        {/* Revenue summary table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Monthly Comparison</h2>
            <p className="text-xs text-slate-400">This month vs. last month</p>
          </div>
          <div className="px-5 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-xs font-medium text-slate-500">Metric</th>
                  <th className="pb-3 text-right text-xs font-medium text-slate-500">Last Month</th>
                  <th className="pb-3 text-right text-xs font-medium text-slate-500">This Month</th>
                  <th className="pb-3 text-right text-xs font-medium text-slate-500">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td className="py-3 font-medium text-slate-700">Revenue</td>
                  <td className="py-3 text-right text-slate-500">
                    {data ? formatCurrency(data.revenue.lastMonth) : '—'}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-900">
                    {data ? formatCurrency(data.revenue.thisMonth) : '—'}
                  </td>
                  <td className="py-3 text-right">
                    {data ? (
                      <span
                        className={`text-xs font-medium ${
                          data.revenue.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {data.revenue.change >= 0 ? '+' : ''}
                        {data.revenue.change}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-slate-700">Orders</td>
                  <td className="py-3 text-right text-slate-500">
                    {data ? data.orders.lastMonth : '—'}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-900">
                    {data ? data.orders.thisMonth : '—'}
                  </td>
                  <td className="py-3 text-right">
                    {data ? (
                      <span
                        className={`text-xs font-medium ${
                          data.orders.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {data.orders.change >= 0 ? '+' : ''}
                        {data.orders.change}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                {data && (
                  <tr>
                    <td className="py-3 font-medium text-slate-700">Avg. Order Value</td>
                    <td className="py-3 text-right text-slate-500">
                      {data.orders.lastMonth > 0
                        ? formatCurrency(data.revenue.lastMonth / data.orders.lastMonth)
                        : '—'}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900">
                      {data.orders.thisMonth > 0
                        ? formatCurrency(data.revenue.thisMonth / data.orders.thisMonth)
                        : '—'}
                    </td>
                    <td className="py-3 text-right text-slate-400 text-xs">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
