'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BulkUpdateModal } from './bulk-update-modal'

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

interface Props {
  variants: InventoryVariant[]
  threshold: number
}

export function InventoryTable({ variants, threshold }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)

  function toggleAll() {
    if (selected.size === variants.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(variants.map((v) => v.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedVariants = variants
    .filter((v) => selected.has(v.id))
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      stock: v.stock,
      productName: v.product.name,
    }))

  function stockClass(stock: number) {
    if (stock === 0) return 'font-semibold text-red-600'
    if (stock <= threshold) return 'font-semibold text-amber-600'
    return 'text-slate-700'
  }

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-800">{selected.size} selected</span>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Update Stock
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === variants.length && variants.length > 0}
                  onChange={toggleAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">Product / Variant</th>
              <th className="px-4 py-3 font-medium text-slate-600">SKU</th>
              <th className="px-4 py-3 font-medium text-slate-600">Stock</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variants.length > 0 ? (
              variants.map((v) => (
                <tr
                  key={v.id}
                  className={`hover:bg-slate-50 ${selected.has(v.id) ? 'bg-blue-50/40' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(v.id)}
                      onChange={() => toggleOne(v.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  {/* Product / Variant */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {v.product.images[0] ? (
                        <img
                          src={v.product.images[0].url}
                          alt={v.product.images[0].altText ?? v.product.name}
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                          —
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/products/${v.product.id}/edit`}
                          className="block truncate font-medium text-slate-900 hover:text-blue-600"
                        >
                          {v.product.name}
                        </Link>
                        {v.name && <p className="truncate text-xs text-slate-400">{v.name}</p>}
                      </div>
                    </div>
                  </td>
                  {/* SKU */}
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.sku}</td>
                  {/* Stock */}
                  <td className="px-4 py-3">
                    <span className={stockClass(v.stock)}>{v.stock}</span>
                    {v.stock === 0 && (
                      <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
                        Out
                      </span>
                    )}
                    {v.stock > 0 && v.stock <= threshold && (
                      <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-600">
                        Low
                      </span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {/* Last updated */}
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(v.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  No variants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <BulkUpdateModal
          selected={selectedVariants}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            setSelected(new Set())
          }}
        />
      )}
    </>
  )
}
