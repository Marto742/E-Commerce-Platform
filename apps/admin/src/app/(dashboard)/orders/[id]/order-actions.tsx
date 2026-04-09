'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatus, updateTrackingNumber, processRefund } from './actions'

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
}

interface Props {
  orderId: string
  status: OrderStatus
  trackingNumber: string | null
  total: string
}

export function OrderActions({ orderId, status, trackingNumber, total }: Props) {
  const [isPending, startTransition] = useTransition()
  const [tracking, setTracking] = useState(trackingNumber ?? '')
  const [error, setError] = useState<string | null>(null)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundError, setRefundError] = useState<string | null>(null)

  const nextStatuses = ALLOWED_TRANSITIONS[status] ?? []

  function handleStatusChange(newStatus: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus)
      } catch {
        setError(`Failed to update status to ${newStatus}`)
      }
    })
  }

  function handleRefundSubmit() {
    setRefundError(null)
    startTransition(async () => {
      try {
        await processRefund(orderId, refundReason)
        setShowRefundModal(false)
        setRefundReason('')
      } catch {
        setRefundError('Failed to process refund. Please try again.')
      }
    })
  }

  function handleTrackingSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTrackingError(null)
    const value = tracking.trim().toUpperCase()
    if (!value) return
    startTransition(async () => {
      try {
        await updateTrackingNumber(orderId, value)
        setTracking(value)
      } catch {
        setTrackingError('Failed to update tracking number')
      }
    })
  }

  return (
    <div className={`space-y-4 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Status transitions */}
      {nextStatuses.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Advance Status
          </p>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                disabled={isPending}
              >
                → {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}

      {/* Refund */}
      {status === 'DELIVERED' && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Refund</p>
          <button
            onClick={() => {
              setShowRefundModal(true)
              setRefundError(null)
            }}
            disabled={isPending}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            Process Refund —{' '}
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              Number(total)
            )}
          </button>

          {showRefundModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                <h3 className="mb-1 text-base font-semibold text-slate-900">Confirm Refund</h3>
                <p className="mb-4 text-sm text-slate-500">
                  This will mark the order as <strong>Refunded</strong> and restore stock. This
                  action cannot be undone.
                </p>

                <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refund amount</span>
                    <span className="font-semibold text-slate-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(Number(total))}
                    </span>
                  </div>
                </div>

                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Reason <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Customer requested return, item damaged, etc."
                  className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {refundError && <p className="mb-3 text-xs text-red-600">{refundError}</p>}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowRefundModal(false)
                      setRefundReason('')
                      setRefundError(null)
                    }}
                    disabled={isPending}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRefundSubmit}
                    disabled={isPending}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                  >
                    {isPending ? 'Processing…' : 'Confirm Refund'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracking number */}
      {!['CANCELLED', 'REFUNDED'].includes(status) && (
        <form onSubmit={handleTrackingSubmit}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Tracking Number
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value.toUpperCase())}
              placeholder="e.g. 1Z999AA1012345678"
              className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isPending || !tracking.trim()}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            >
              Save
            </button>
          </div>
          {trackingError && <p className="mt-1 text-xs text-red-600">{trackingError}</p>}
        </form>
      )}
    </div>
  )
}
