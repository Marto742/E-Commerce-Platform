'use client'

import { useState, useTransition } from 'react'
import { deleteCategoryAction } from './actions'

interface Props {
  id: string
  name: string
  productCount: number
}

export function DeleteCategoryButton({ id, name, productCount }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (productCount > 0) {
    return (
      <span className="text-xs text-slate-300" title="Remove all products first">
        Delete
      </span>
    )
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-500">Delete &ldquo;{name}&rdquo;?</span>
        <button
          onClick={() => {
            setError(null)
            startTransition(async () => {
              try {
                await deleteCategoryAction(id)
              } catch {
                setError('Failed')
                setConfirming(false)
              }
            })
          }}
          disabled={isPending}
          className="font-medium text-red-600 hover:text-red-800 disabled:opacity-40"
        >
          {isPending ? '…' : 'Yes'}
        </button>
        <span className="text-slate-300">·</span>
        <button
          onClick={() => setConfirming(false)}
          className="font-medium text-slate-500 hover:text-slate-700"
        >
          No
        </button>
        {error && <span className="text-red-500">{error}</span>}
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium text-red-500 hover:text-red-700"
    >
      Delete
    </button>
  )
}
