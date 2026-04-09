import type { Metadata } from 'next'
import { Suspense } from 'react'
import { serverFetch } from '@/lib/server-fetch'
import { CustomerFilters } from '@/components/customers/customer-filters'
import { PaginationBar } from '@/components/ui/pagination-bar'

export const metadata: Metadata = { title: 'Customers' }

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomerStatus = 'UNVERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'

interface Customer {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  status: CustomerStatus
  emailVerifiedAt: string | null
  createdAt: string
  _count: { orders: number }
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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

const STATUS_STYLES: Record<CustomerStatus, string> = {
  UNVERIFIED: 'bg-yellow-50 text-yellow-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  SUSPENDED: 'bg-amber-50 text-amber-700',
  DELETED: 'bg-slate-100 text-slate-500',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null) qs.set(k, v)
  }
  if (!qs.has('limit')) qs.set('limit', '20')

  const result = await serverFetch<{ data: Customer[]; meta: PaginationMeta }>(
    `/admin/customers?${qs.toString()}`
  ).catch(() => null)

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          {result && <p className="text-sm text-slate-500">{result.meta.total} total</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Suspense>
          <CustomerFilters />
        </Suspense>
      </div>

      {!result && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load customers. Make sure the API is running.
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Customer</th>
              <th className="px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="px-4 py-3 font-medium text-slate-600">Phone</th>
              <th className="px-4 py-3 font-medium text-slate-600">Orders</th>
              <th className="px-4 py-3 font-medium text-slate-600">Joined</th>
              <th className="px-4 py-3 font-medium text-slate-600">Verified</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result && result.data.length > 0 ? (
              result.data.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  {/* Name */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {customer.firstName || customer.lastName
                        ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
                        : '—'}
                    </p>
                    <p className="font-mono text-xs text-slate-400">{customer.id.slice(0, 8)}</p>
                  </td>
                  {/* Email */}
                  <td className="px-4 py-3 text-slate-700">{customer.email}</td>
                  {/* Phone */}
                  <td className="px-4 py-3 text-slate-500">{customer.phoneNumber ?? '—'}</td>
                  {/* Orders */}
                  <td className="px-4 py-3 text-slate-700">{customer._count.orders}</td>
                  {/* Joined */}
                  <td className="px-4 py-3 text-slate-600">{formatDate(customer.createdAt)}</td>
                  {/* Email verified */}
                  <td className="px-4 py-3">
                    {customer.emailVerifiedAt ? (
                      <span className="text-emerald-600">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[customer.status]}`}
                    >
                      {customer.status.charAt(0) + customer.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  {result ? 'No customers found.' : '—'}
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
