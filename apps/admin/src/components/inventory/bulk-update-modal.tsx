'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { bulkUpdateStock } from '@/app/(dashboard)/inventory/actions'

interface Variant {
  id: string
  sku: string
  name: string
  stock: number
  productName: string
}

interface Props {
  selected: Variant[]
  onClose: () => void
  onSuccess: () => void
}

type Operation = 'set' | 'add' | 'subtract'

export function BulkUpdateModal({ selected, onClose, onSuccess }: Props) {
  const [operation, setOperation] = useState<Operation>('set')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty < 0) {
      setError('Quantity must be a non-negative integer.')
      return
    }
    setError('')
    startTransition(async () => {
      try {
        await bulkUpdateStock(selected.map((v) => ({ variantId: v.id, operation, quantity: qty })))
        onSuccess()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Update failed.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Update Stock — {selected.length} variant{selected.length !== 1 ? 's' : ''}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Selected list */}
        <div className="max-h-48 overflow-y-auto border-b border-slate-100 px-5 py-3">
          <ul className="space-y-1 text-sm text-slate-700">
            {selected.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-4">
                <span className="truncate">
                  <span className="font-medium">{v.productName}</span>
                  {v.name && <span className="text-slate-500"> — {v.name}</span>}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  SKU: {v.sku} · Stock: {v.stock}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Operation</label>
            <div className="flex gap-2">
              {(['set', 'add', 'subtract'] as Operation[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setOperation(op)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    operation === op
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="qty" className="mb-1.5 block text-sm font-medium text-slate-700">
              Quantity
            </label>
            <input
              id="qty"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? 'Updating…' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
