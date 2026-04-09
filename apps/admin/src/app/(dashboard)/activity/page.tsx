import type { Metadata } from 'next'
import { serverFetch } from '@/lib/server-fetch'

export const metadata: Metadata = { title: 'Activity Log' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  meta: Record<string, unknown> | null
  createdAt: string
  admin: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

interface ListResponse {
  data: ActivityLog[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  'coupon.create': 'Created coupon',
  'coupon.update': 'Updated coupon',
  'coupon.delete': 'Deleted coupon',
  'product.create': 'Created product',
  'product.update': 'Updated product',
  'product.delete': 'Deleted product',
  'product.stock_adjust': 'Adjusted stock',
  'product.import': 'Imported products',
  'category.create': 'Created category',
  'category.update': 'Updated category',
  'category.delete': 'Deleted category',
  'order.status_update': 'Updated order status',
  'order.refund': 'Refunded order',
  'order.tracking_update': 'Updated tracking number',
}

const ENTITY_COLORS: Record<string, string> = {
  coupon: 'bg-violet-50 text-violet-700',
  product: 'bg-blue-50 text-blue-700',
  category: 'bg-amber-50 text-amber-700',
  order: 'bg-emerald-50 text-emerald-700',
}

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return ''
  const parts: string[] = []
  if (meta.code) parts.push(`code: ${meta.code}`)
  if (meta.name) parts.push(`"${meta.name}"`)
  if (meta.status) parts.push(`→ ${meta.status}`)
  if (meta.trackingNumber) parts.push(`#${meta.trackingNumber}`)
  if (meta.imported != null) parts.push(`${meta.imported} imported`)
  if (meta.skipped != null) parts.push(`${meta.skipped} skipped`)
  if (meta.operation && meta.quantity != null)
    parts.push(`${meta.operation} ${meta.quantity} units`)
  return parts.join(' · ')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ entity?: string; page?: string }>
}

export default async function ActivityPage({ searchParams }: Props) {
  const { entity, page = '1' } = await searchParams

  let logs: ActivityLog[] = []
  let total = 0
  let totalPages = 1

  try {
    const params = new URLSearchParams({ page, limit: '50' })
    if (entity) params.set('entity', entity)
    const res = await serverFetch<ListResponse>(`/admin/activity-logs?${params}`)
    logs = res.data
    total = res.meta.total
    totalPages = res.meta.totalPages
  } catch {
    // handled below
  }

  const currentPage = Number(page)

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-sm text-slate-500">{total} events recorded</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {['', 'coupon', 'product', 'category', 'order'].map((e) => (
          <a
            key={e}
            href={e ? `/activity?entity=${e}` : '/activity'}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              entity === e || (!entity && e === '')
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {e ? e.charAt(0).toUpperCase() + e.slice(1) + 's' : 'All'}
          </a>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {logs.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-400">No activity recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-600">When</th>
                <th className="px-4 py-3 font-medium text-slate-600">Admin</th>
                <th className="px-4 py-3 font-medium text-slate-600">Entity</th>
                <th className="px-4 py-3 font-medium text-slate-600">Action</th>
                <th className="px-4 py-3 font-medium text-slate-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.admin ? (
                      <span className="font-medium text-slate-700">
                        {log.admin.firstName} {log.admin.lastName}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        ENTITY_COLORS[log.entity] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {log.entity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatMeta(log.meta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <a
                href={`/activity?${new URLSearchParams({ ...(entity ? { entity } : {}), page: String(currentPage - 1) })}`}
                className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50"
              >
                Previous
              </a>
            )}
            {currentPage < totalPages && (
              <a
                href={`/activity?${new URLSearchParams({ ...(entity ? { entity } : {}), page: String(currentPage + 1) })}`}
                className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
