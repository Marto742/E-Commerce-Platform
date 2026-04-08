'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

interface Meta {
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface Props {
  meta: Meta
}

export function PaginationBar({ meta }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className={`flex items-center justify-between text-sm ${isPending ? 'opacity-60' : ''}`}>
      <span className="text-slate-500">
        Page {meta.page} of {meta.totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => goTo(meta.page - 1)}
          disabled={!meta.hasPrevPage || isPending}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => goTo(meta.page + 1)}
          disabled={!meta.hasNextPage || isPending}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
