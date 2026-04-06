'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingBag, ChevronRight, Package } from 'lucide-react'
import type { Order } from '@/app/orders/page'
import { OrderStatusBadge } from '@/components/account/order-status-badge'

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <ShoppingBag className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-1 font-semibold text-gray-900">No orders yet</h3>
      <p className="mb-6 text-sm text-gray-500">When you place an order, it will show up here.</p>
      <Link
        href="/products"
        className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Start shopping
      </Link>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  meta: { page: number; totalPages: number }
}

function Pagination({ meta }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (meta.totalPages <= 1) return null

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <div className="mt-6 flex items-center justify-between border-t pt-4">
      <button
        onClick={() => goToPage(meta.page - 1)}
        disabled={meta.page <= 1}
        className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {meta.page} of {meta.totalPages}
      </span>
      <button
        onClick={() => goToPage(meta.page + 1)}
        disabled={meta.page >= meta.totalPages}
        className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const previewItems = order.items.slice(0, 2)
  const remaining = order._count.items - previewItems.length

  return (
    <Link
      href={`/orders/${order.id}`}
      className="group block rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <Package className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Order ID</p>
            <p className="font-mono text-sm font-medium text-gray-900">
              #{order.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {previewItems.map((item) => (
          <p key={item.id} className="truncate text-sm text-gray-600">
            {item.quantity}× {item.productName}
          </p>
        ))}
        {remaining > 0 && (
          <p className="text-sm text-gray-400">
            +{remaining} more item{remaining !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-gray-500">{date}</span>
        <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>
      </div>

      {order.trackingNumber && (
        <p className="mt-2 text-xs text-gray-400">
          Tracking: <span className="font-mono">{order.trackingNumber}</span>
        </p>
      )}
    </Link>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────

interface Props {
  orders: Order[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export function OrderList({ orders, meta }: Props) {
  if (orders.length === 0) return <EmptyOrders />

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
      <Pagination meta={meta} />
    </>
  )
}
