import { cn } from '@repo/ui'

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-600',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

interface Props {
  status: string
  large?: boolean
}

export function OrderStatusBadge({ status, large }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        large ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs',
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}
