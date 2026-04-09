'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'

interface AlertVariant {
  id: string
  sku: string
  name: string
  stock: number
  productId: string
  productName: string
}

interface Props {
  outOfStock: AlertVariant[]
  lowStock: AlertVariant[]
  threshold: number
}

const DISMISS_KEY = 'inventory-alert-dismissed'

export function LowStockAlert({ outOfStock, lowStock, threshold }: Props) {
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    const stored = sessionStorage.getItem(DISMISS_KEY)
    if (!stored) setDismissed(false)
  }, [])

  if (dismissed || (outOfStock.length === 0 && lowStock.length === 0)) return null

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const total = outOfStock.length + lowStock.length

  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {total} variant{total !== 1 ? 's' : ''} need attention
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              {outOfStock.length > 0 && (
                <span className="font-medium text-red-700">{outOfStock.length} out of stock</span>
              )}
              {outOfStock.length > 0 && lowStock.length > 0 && ' · '}
              {lowStock.length > 0 && (
                <span>
                  {lowStock.length} low stock (≤ {threshold} units)
                </span>
              )}
            </p>

            {/* Out-of-stock list (up to 5) */}
            {outOfStock.length > 0 && (
              <ul className="mt-2 space-y-1">
                {outOfStock.slice(0, 5).map((v) => (
                  <li key={v.id} className="flex items-center gap-2 text-xs">
                    <span className="inline-flex rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                      OUT
                    </span>
                    <Link
                      href={`/products/${v.productId}/edit`}
                      className="font-medium text-slate-800 hover:text-blue-600"
                    >
                      {v.productName}
                      {v.name ? ` — ${v.name}` : ''}
                    </Link>
                    <span className="font-mono text-slate-400">{v.sku}</span>
                  </li>
                ))}
                {outOfStock.length > 5 && (
                  <li className="text-xs text-amber-700">
                    + {outOfStock.length - 5} more —{' '}
                    <Link
                      href="/inventory?tab=low-stock"
                      className="underline hover:text-amber-900"
                    >
                      view all
                    </Link>
                  </li>
                )}
              </ul>
            )}

            {/* Low-stock list (up to 5, only if no out-of-stock overflow) */}
            {lowStock.length > 0 && outOfStock.length <= 5 && (
              <ul className="mt-2 space-y-1">
                {lowStock.slice(0, 5 - Math.min(outOfStock.length, 5)).map((v) => (
                  <li key={v.id} className="flex items-center gap-2 text-xs">
                    <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                      {v.stock}
                    </span>
                    <Link
                      href={`/products/${v.productId}/edit`}
                      className="font-medium text-slate-800 hover:text-blue-600"
                    >
                      {v.productName}
                      {v.name ? ` — ${v.name}` : ''}
                    </Link>
                    <span className="font-mono text-slate-400">{v.sku}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/inventory?tab=low-stock"
              className="mt-2 inline-block text-xs font-medium text-amber-800 underline hover:text-amber-900"
            >
              View all low-stock variants →
            </Link>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
