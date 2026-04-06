import { cn } from '@repo/ui'
import { Check, Clock, X } from 'lucide-react'

const STEPS = [
  { status: 'PENDING', label: 'Order placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
]

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

interface Props {
  status: string
  updatedAt: string
}

export function OrderTimeline({ status, updatedAt }: Props) {
  const isCancelled = status === 'CANCELLED'
  const isRefunded = status === 'REFUNDED'
  const currentIndex = STATUS_ORDER.indexOf(status)

  if (isCancelled || isRefunded) {
    return (
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">Order status</h2>
        </div>
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <X className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-700">
              {isCancelled ? 'Order cancelled' : 'Order refunded'}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold text-gray-900">Order status</h2>
      </div>
      <div className="px-5 py-4">
        <ol className="relative space-y-4">
          {STEPS.map((step, i) => {
            const done = i < currentIndex
            const active = i === currentIndex
            const upcoming = i > currentIndex

            return (
              <li key={step.status} className="flex items-start gap-4">
                {/* connector line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                      done && 'border-indigo-600 bg-indigo-600',
                      active && 'border-indigo-600 bg-white',
                      upcoming && 'border-gray-200 bg-white'
                    )}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5 text-white" />
                    ) : active ? (
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-gray-200" />
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'mt-1 w-0.5 flex-1',
                        i < currentIndex ? 'bg-indigo-600' : 'bg-gray-200'
                      )}
                      style={{ minHeight: '1.5rem' }}
                    />
                  )}
                </div>
                <div className="pb-2 pt-0.5">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      done || active ? 'text-gray-900' : 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {active && <p className="text-xs text-indigo-600">Current status</p>}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
