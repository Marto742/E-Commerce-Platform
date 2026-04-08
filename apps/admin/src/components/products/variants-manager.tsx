'use client'

import { useState, useTransition } from 'react'
import { VariantForm } from './variant-form'
import {
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
} from '@/app/(dashboard)/products/actions'

interface Variant {
  id: string
  name: string
  sku: string
  price: string | number
  stock: number
  isActive: boolean
  attributes: Record<string, unknown>
}

interface Props {
  productId: string
  variants: Variant[]
}

export function VariantsManager({ productId, variants }: Props) {
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete(variantId: string) {
    if (!confirm('Delete this variant? This cannot be undone.')) return
    setDeleteError(null)
    startTransition(async () => {
      const err = await deleteVariantAction(productId, variantId)
      if (err) setDeleteError(err)
    })
  }

  return (
    <div>
      {deleteError && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {/* Existing variants */}
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {variants.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">No variants yet.</p>
        )}
        {variants.map((v) => (
          <div key={v.id}>
            {editingId === v.id ? (
              <div className="px-4 py-4">
                <VariantForm
                  defaultValues={v}
                  action={(prev, fd) =>
                    updateVariantAction(productId, v.id, prev, fd).then((err) => {
                      if (!err) setEditingId(null)
                      return err
                    })
                  }
                  submitLabel="Save variant"
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{v.name}</span>
                    {!v.isActive && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        Inactive
                      </span>
                    )}
                    {Object.entries(v.attributes).map(([k, val]) => (
                      <span
                        key={k}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {k}: {String(val)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    SKU: {v.sku} · ${Number(v.price).toFixed(2)} · stock: {v.stock}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditingId(v.id)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={isPending}
                    className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new variant */}
      {showNew ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">New variant</h3>
          <VariantForm
            action={(prev, fd) =>
              createVariantAction(productId, prev, fd).then((err) => {
                if (!err) setShowNew(false)
                return err
              })
            }
            submitLabel="Add variant"
            onCancel={() => setShowNew(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          + Add variant
        </button>
      )}
    </div>
  )
}
