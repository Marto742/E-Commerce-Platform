import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { serverFetch } from '@/lib/server-fetch'
import { OrderFilters } from '@/components/orders/order-filters'
import { PaginationBar } from '@/components/ui/pagination-bar'

export const metadata: Metadata = { title: 'Orders' }

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

interface OrderItem {
  id: string
  productName: string
  quantity: number
  price: string
}

interface Order {
  id: string
  status: OrderStatus
  total: string
  subtotal: string
  shippingCost: string
  tax: string
  discountAmount: string
  couponCode: string | null
  trackingNumber: string | null
  createdAt: string
  userId: string | null
  notes: string | null
  items: OrderItem[]
  _count: { items: number }
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  SHIPPED: 'bg-cyan-50 text-cyan-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-600',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null) qs.set(k, v)
  }
  if (!qs.has('limit')) qs.set('limit', '20')

  const result = await serverFetch<{ data: Order[]; meta: PaginationMeta }>(
    `/orders?${qs.toString()}`
  ).catch(() => null)

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          {result && <p className="text-sm text-slate-500">{result.meta.total} total</p>}
        </div>
        <a
          href="/api/orders/export"
          download
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Suspense>
          <OrderFilters />
        </Suspense>
      </div>

      {!result && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load orders. Make sure the API is running.
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Order</th>
              <th className="px-4 py-3 font-medium text-slate-600">Date</th>
              <th className="px-4 py-3 font-medium text-slate-600">Items</th>
              <th className="px-4 py-3 font-medium text-slate-600">Total</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600">Tracking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result && result.data.length > 0 ? (
              result.data.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  {/* Order ID */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      {order.id.slice(0, 8).toUpperCase()}
                    </Link>
                    {order.couponCode && (
                      <p className="mt-0.5 text-xs text-slate-400">Coupon: {order.couponCode}</p>
                    )}
                  </td>
                  {/* Date */}
                  <td className="px-4 py-3 text-slate-600">{formatDate(order.createdAt)}</td>
                  {/* Items */}
                  <td className="px-4 py-3 text-slate-700">{order._count.items}</td>
                  {/* Total */}
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(order.total)}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  {/* Tracking */}
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {order.trackingNumber ?? '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  {result ? 'No orders found.' : '—'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result && result.meta.totalPages > 1 && (
        <div className="mt-4">
          <PaginationBar meta={result.meta} />
        </div>
      )}
    </div>
  )
}
