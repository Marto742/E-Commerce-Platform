'use client'

import { useTransition, useState } from 'react'

interface Props {
  action: () => Promise<string | null>
}

export function DeleteProductButton({ action }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (!confirm('Delete this product and all its variants? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      const err = await action()
      if (err) setError(err)
    })
  }

  return (
    <div>
      {error && <p className="mb-1 text-xs text-red-600">{error}</p>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : 'Delete product'}
      </button>
    </div>
  )
}
