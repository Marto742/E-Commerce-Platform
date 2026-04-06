'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@repo/ui'

const TABS = [
  { label: 'All', status: undefined },
  { label: 'Pending', status: 'PENDING' },
  { label: 'Confirmed', status: 'CONFIRMED' },
  { label: 'Processing', status: 'PROCESSING' },
  { label: 'Shipped', status: 'SHIPPED' },
  { label: 'Delivered', status: 'DELIVERED' },
  { label: 'Cancelled', status: 'CANCELLED' },
]

interface Props {
  activeStatus: string | undefined
}

export function OrderStatusTabs({ activeStatus }: Props) {
  const searchParams = useSearchParams()

  function buildHref(status: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    const qs = params.toString()
    return `/orders${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b">
      {TABS.map(({ label, status }) => {
        const isActive = status === activeStatus
        return (
          <Link
            key={label}
            href={buildHref(status)}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
