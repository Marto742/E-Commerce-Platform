import type { Metadata } from 'next'
import { Suspense } from 'react'
import { serverFetch } from '@/lib/server-fetch'
import { ProductFilters } from '@/components/products/product-filters'
import { PaginationBar } from '@/components/ui/pagination-bar'

export const metadata: Metadata = { title: 'Products' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  slug: string
  basePrice: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  totalStock: number
  category: { id: string; name: string }
  images: Array<{ url: string; altText: string | null }>
  _count: { variants: number; reviews: number }
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface Category {
  id: string
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams

  // Build query string from searchParams
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null) qs.set(k, v)
  }
  if (!qs.has('limit')) qs.set('limit', '20')

  const [productsRes, categoriesRes] = await Promise.allSettled([
    serverFetch<{ data: Product[]; meta: PaginationMeta }>(`/admin/products?${qs.toString()}`),
    serverFetch<{ data: Category[] }>('/categories?flat=true'),
  ])

  const productsData = productsRes.status === 'fulfilled' ? productsRes.value : null
  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : []
  const fetchError = productsRes.status === 'rejected'

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          {productsData && (
            <p className="text-sm text-slate-500">{productsData.meta.total} total</p>
          )}
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Suspense>
          <ProductFilters categories={categories} />
        </Suspense>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load products. Make sure the API is running.
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Product</th>
              <th className="px-4 py-3 font-medium text-slate-600">Category</th>
              <th className="px-4 py-3 font-medium text-slate-600">Price</th>
              <th className="px-4 py-3 font-medium text-slate-600">Stock</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600">Reviews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productsData && productsData.data.length > 0 ? (
              productsData.data.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].altText ?? product.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                          No img
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-medium text-slate-900">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-slate-400">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3 text-slate-700">{product.category.name}</td>
                  {/* Price */}
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(product.basePrice)}
                  </td>
                  {/* Stock */}
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.totalStock === 0
                          ? 'font-semibold text-red-600'
                          : product.totalStock < 5
                            ? 'font-semibold text-amber-600'
                            : 'text-slate-700'
                      }
                    >
                      {product.totalStock}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {product.isFeatured && (
                        <span className="inline-flex w-fit rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Reviews */}
                  <td className="px-4 py-3 text-slate-500">{product._count.reviews}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  {productsData ? 'No products found.' : '—'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {productsData && productsData.meta.totalPages > 1 && (
        <div className="mt-4">
          <PaginationBar meta={productsData.meta} />
        </div>
      )}
    </div>
  )
}
