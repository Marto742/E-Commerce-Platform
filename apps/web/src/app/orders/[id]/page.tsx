import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Package, MapPin, CreditCard, Tag } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api-client'
import { OrderStatusBadge } from '@/components/account/order-status-badge'
import { OrderTimeline } from '@/components/account/order-timeline'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressSnapshot {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

interface OrderItemDetail {
  id: string
  productName: string
  variantName: string
  quantity: number
  price: number
  variant: {
    product: {
      id: string
      name: string
      slug: string
      images: { url: string; altText: string | null }[]
    }
  }
}

interface OrderDetail {
  id: string
  status: string
  subtotal: number
  shippingCost: number
  tax: number
  discountAmount: number
  total: number
  shippingAddress: AddressSnapshot
  billingAddress: AddressSnapshot
  couponCode: string | null
  trackingNumber: string | null
  notes: string | null
  guestEmail: string | null
  createdAt: string
  updatedAt: string
  items: OrderItemDetail[]
}

interface OrderDetailResponse {
  data: OrderDetail
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return { title: `Order #${id.slice(-8).toUpperCase()}` }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatAddress(a: AddressSnapshot) {
  const lines = [
    `${a.firstName} ${a.lastName}`,
    a.line1,
    a.line2,
    `${a.city}, ${a.state} ${a.postalCode}`,
    a.country,
    a.phone,
  ].filter(Boolean)
  return lines as string[]
}

function formatMoney(n: number) {
  return `$${Number(n).toFixed(2)}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login?callbackUrl=/orders')

  const { id } = await params

  let order: OrderDetail | null = null

  try {
    const res = await apiFetch<OrderDetailResponse>(`/orders/${id}`, {
      method: 'GET',
      accessToken: session.accessToken,
    })
    order = res.data
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  const shippingLines = formatAddress(order.shippingAddress)
  const billingLines = formatAddress(order.billingAddress)
  const hasDiscount = Number(order.discountAmount) > 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} large />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — items + timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <Package className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Items ({order.items.length})</h2>
            </div>
            <ul className="divide-y">
              {order.items.map((item) => {
                const image = item.variant.product.images[0]
                return (
                  <li key={item.id} className="flex gap-4 px-5 py-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.url}
                          alt={image.altText ?? item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <Link
                        href={`/products/${item.variant.product.slug}`}
                        className="truncate font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-500">{item.variantName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium text-gray-900">{formatMoney(item.price)}</p>
                      <p className="text-sm text-gray-500">Qty {item.quantity}</p>
                    </div>
                  </li>
                )
              })}
            </ul>

            {order.trackingNumber && (
              <div className="border-t bg-indigo-50 px-5 py-3">
                <p className="text-sm text-indigo-700">
                  Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span>
                </p>
              </div>
            )}
          </section>

          {/* Status timeline */}
          <OrderTimeline status={order.status} updatedAt={order.updatedAt} />
        </div>

        {/* Right column — summary + addresses */}
        <div className="space-y-6">
          {/* Order summary */}
          <section className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Summary</h2>
            </div>
            <dl className="space-y-2 px-5 py-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
              {hasDiscount && (
                <div className="flex justify-between text-green-600">
                  <dt className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {order.couponCode ? `Coupon (${order.couponCode})` : 'Discount'}
                  </dt>
                  <dd>−{formatMoney(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <dt>Shipping</dt>
                <dd>
                  {Number(order.shippingCost) === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatMoney(order.shippingCost)
                  )}
                </dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Tax</dt>
                <dd>{formatMoney(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
                <dt>Total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Shipping address */}
          <section className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <MapPin className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Shipping address</h2>
            </div>
            <address className="not-italic px-5 py-4 text-sm text-gray-600">
              {shippingLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </address>
          </section>

          {/* Billing address — only if different */}
          {JSON.stringify(order.shippingAddress) !== JSON.stringify(order.billingAddress) && (
            <section className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b px-5 py-4">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Billing address</h2>
              </div>
              <address className="not-italic px-5 py-4 text-sm text-gray-600">
                {billingLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </address>
            </section>
          )}

          {/* Notes */}
          {order.notes && (
            <section className="rounded-xl border bg-white shadow-sm">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold text-gray-900">Order notes</h2>
              </div>
              <p className="px-5 py-4 text-sm text-gray-600">{order.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
