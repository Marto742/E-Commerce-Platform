import type { Metadata } from 'next'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { OrderList } from '@/components/account/order-list'
import { OrderStatusTabs } from '@/components/account/order-status-tabs'

export const metadata: Metadata = { title: 'Orders' }

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface OrderItem {
  id: string
  productName: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  status: OrderStatus
  total: number
  subtotal: number
  tax: number
  shippingCost: number
  trackingNumber: string | null
  createdAt: string
  updatedAt: string
  _count: { items: number }
  items: OrderItem[]
}

interface OrdersResponse {
  data: {
    orders: Order[]
    meta: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login?callbackUrl=/orders')

  const { status, page } = await searchParams
  const validStatuses: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]
  const activeStatus = validStatuses.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined

  let ordersData: OrdersResponse['data'] | null = null
  let fetchError: string | null = null

  try {
    const res = await apiFetch<OrdersResponse>('/orders', {
      method: 'GET',
      accessToken: session.accessToken,
      params: {
        page: page ?? 1,
        limit: 10,
        ...(activeStatus ? { status: activeStatus } : {}),
      },
    })
    ordersData = res.data
  } catch {
    fetchError = 'Could not load your orders. Please try again later.'
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ordersData
            ? `${ordersData.meta.total} order${ordersData.meta.total !== 1 ? 's' : ''}`
            : ''}
        </p>
      </div>

      <Suspense fallback={<div className="mb-6 h-10 animate-pulse rounded-lg bg-gray-100" />}>
        <OrderStatusTabs activeStatus={activeStatus} />
      </Suspense>

      {fetchError ? (
        <div className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{fetchError}</div>
      ) : (
        <Suspense
          fallback={
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          }
        >
          <OrderList
            orders={ordersData?.orders ?? []}
            meta={ordersData?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 0 }}
          />
        </Suspense>
      )}
    </div>
  )
}
