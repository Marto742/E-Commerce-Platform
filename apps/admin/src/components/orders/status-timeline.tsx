type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

// The happy-path pipeline steps in order
const PIPELINE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STEP_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

interface Props {
  status: OrderStatus
}

export function StatusTimeline({ status }: Props) {
  const isTerminalBad = status === 'CANCELLED' || status === 'REFUNDED'

  // For terminal bad states, show which step the order was at when it ended
  // We can't know exactly, so just show all steps as inactive and a separate badge
  const currentIndex = isTerminalBad ? -1 : PIPELINE.indexOf(status)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">Order Progress</h2>

      {isTerminalBad ? (
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {STEP_LABELS[status]}
          </span>
          <span className="text-sm text-slate-400">
            {status === 'CANCELLED'
              ? 'This order has been cancelled.'
              : 'This order has been refunded.'}
          </span>
        </div>
      ) : (
        <ol className="flex items-start gap-0">
          {PIPELINE.map((step, i) => {
            const isDone = i < currentIndex
            const isActive = i === currentIndex
            const isUpcoming = i > currentIndex

            return (
              <li key={step} className="flex flex-1 flex-col items-center">
                <div className="relative flex w-full items-center">
                  {/* Left connector */}
                  <div
                    className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : isDone || isActive ? 'bg-blue-500' : 'bg-slate-200'}`}
                  />
                  {/* Circle */}
                  <div
                    className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      isActive
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : isDone
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  {/* Right connector */}
                  <div
                    className={`h-0.5 flex-1 ${i === PIPELINE.length - 1 ? 'invisible' : isDone ? 'bg-blue-500' : 'bg-slate-200'}`}
                  />
                </div>
                {/* Label */}
                <p
                  className={`mt-2 text-center text-xs font-medium ${
                    isActive ? 'text-blue-600' : isDone ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {STEP_LABELS[step]}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
