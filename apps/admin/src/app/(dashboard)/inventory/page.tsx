import type { Metadata } from 'next'
import { Suspense } from 'react'
import { serverFetch } from '@/lib/server-fetch'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { LowStockAlert } from '@/components/inventory/low-stock-alert'
import { PaginationBar } from '@/components/ui/pagination-bar'

export const metadata: Metadata = { title: 'Inventory' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryVariant {
  id: string
  sku: string
  name: string
  stock: number
  isActive: boolean
  updatedAt: string
  product: {
    id: string
    name: string
    slug: string
    isActive: boolean
    images: Array<{ url: string; altText: string | null }>
  }
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface StockSummary {
  total: number
  outOfStock: number
  lowStock: number
  threshold: number
}

interface AlertVariant {
  id: string
  sku: string
  name: string
  stock: number
  product: { id: string; name: string }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams
  const tab = params['tab'] ?? 'all'

  // Build query string
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && k !== 'tab') qs.set(k, v)
  }
  if (!qs.has('limit')) qs.set('limit', '25')

  const endpoint = tab === 'low-stock' ? `/inventory/low-stock?${qs}` : `/inventory?${qs}`

  const [variantsRes, summaryRes, alertRes] = await Promise.allSettled([
    serverFetch<{ data: InventoryVariant[]; meta: PaginationMeta }>(endpoint),
    serverFetch<{ data: StockSummary }>('/inventory/summary'),
    serverFetch<{ data: AlertVariant[] }>('/inventory/low-stock?limit=20'),
  ])

  const variantsData = variantsRes.status === 'fulfilled' ? variantsRes.value : null
  const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data : null
  const alertVariants = alertRes.status === 'fulfilled' ? alertRes.value.data : []
  const fetchError = variantsRes.status === 'rejected'
  const threshold = summary?.threshold ?? 10

  const outOfStockAlerts = alertVariants
    .filter((v) => v.stock === 0)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      stock: v.stock,
      productId: v.product.id,
      productName: v.product.name,
    }))
  const lowStockAlerts = alertVariants
    .filter((v) => v.stock > 0)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      stock: v.stock,
      productId: v.product.id,
      productName: v.product.name,
    }))

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          {variantsData && (
            <p className="text-sm text-slate-500">{variantsData.meta.total} variants</p>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Active Variants</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">Low Stock</p>
            <p className="mt-2 text-3xl font-bold text-amber-800">{summary.lowStock}</p>
            <p className="mt-1 text-xs text-amber-600">≤ {summary.threshold} units</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">Out of Stock</p>
            <p className="mt-2 text-3xl font-bold text-red-800">{summary.outOfStock}</p>
            <p className="mt-1 text-xs text-red-500">0 units remaining</p>
          </div>
        </div>
      )}

      {/* Low-stock alert banner */}
      <LowStockAlert
        outOfStock={outOfStockAlerts}
        lowStock={lowStockAlerts}
        threshold={threshold}
      />

      {/* Filters */}
      <div className="mb-4">
        <Suspense>
          <InventoryFilters />
        </Suspense>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load inventory. Make sure the API is running.
        </div>
      )}

      {/* Table */}
      {variantsData && <InventoryTable variants={variantsData.data} threshold={threshold} />}

      {/* Pagination */}
      {variantsData && variantsData.meta.totalPages > 1 && (
        <div className="mt-4">
          <PaginationBar meta={variantsData.meta} />
        </div>
      )}
    </div>
  )
}
