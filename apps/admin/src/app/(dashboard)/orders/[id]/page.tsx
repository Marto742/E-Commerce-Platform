import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/server-fetch'
import { OrderActions } from './order-actions'
import { StatusTimeline } from '@/components/orders/status-timeline'

export const metadata: Metadata = { title: 'Order Detail' }

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

interface Address {
  line1: string
  line2: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

interface OrderItem {
  id: string
  productName: string
  variantName: string
  quantity: number
  price: string
  variant: {
    product: {
      id: string
      name: string
      slug: string
      images: Array<{ url: string; altText: string | null }>
    }
  }
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
  shippingAddress: Address
  billingAddress: Address
  items: OrderItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
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

function AddressBlock({ address }: { address: Address }) {
  return (
    <address className="not-italic text-sm text-slate-700 leading-relaxed">
      {address.line1}
      {address.line2 && <>, {address.line2}</>}
      <br />
      {address.city}, {address.state} {address.postalCode}
      <br />
      {address.country}
    </address>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params

  const result = await serverFetch<{ data: Order }>(`/orders/${id}`).catch(() => null)

  if (!result) notFound()

  const order = result.data

  return (
    <div className="max-w-4xl">
      {/* Back + Header */}
      <div className="mb-6">
        <Link
          href="/orders"
          className="mb-3 inline-flex text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to Orders
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold text-slate-900">
              {order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">{formatDate(order.createdAt)}</p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[order.status]}`}
          >
            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Status timeline */}
      <div className="mb-6">
        <StatusTimeline status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — items + totals */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="font-semibold text-slate-900">Items</h2>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.variant.product.images[0] ? (
                          <img
                            src={item.variant.product.images[0].url}
                            alt={item.variant.product.images[0].altText ?? item.productName}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                            No img
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{item.productName}</p>
                          <p className="text-xs text-slate-400">{item.variantName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {item.quantity} × {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Summary</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="text-slate-900">{formatCurrency(order.subtotal)}</dd>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ''}
                  </dt>
                  <dd className="text-emerald-600">−{formatCurrency(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Shipping</dt>
                <dd className="text-slate-900">{formatCurrency(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tax</dt>
                <dd className="text-slate-900">{formatCurrency(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold">
                <dt className="text-slate-900">Total</dt>
                <dd className="text-slate-900">{formatCurrency(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right column — actions + addresses */}
        <div className="space-y-6">
          {/* Admin actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Actions</h2>
            <OrderActions
              orderId={order.id}
              status={order.status}
              trackingNumber={order.trackingNumber}
              total={order.total}
            />
            {order.notes && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="text-sm text-slate-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Customer */}
          {order.userId && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-semibold text-slate-900">Customer</h2>
              <p className="font-mono text-xs text-slate-500">{order.userId}</p>
            </div>
          )}

          {/* Shipping address */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-semibold text-slate-900">Shipping Address</h2>
            <AddressBlock address={order.shippingAddress} />
          </div>

          {/* Billing address */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-semibold text-slate-900">Billing Address</h2>
            <AddressBlock address={order.billingAddress} />
          </div>
        </div>
      </div>
    </div>
  )
}
