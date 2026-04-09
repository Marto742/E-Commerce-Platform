'use client'

import { useState, useTransition } from 'react'

export interface CouponFormData {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  minOrderAmount: string
  maxUses: string
  expiresAt: string
  isActive: boolean
}

interface Props {
  initial?: Partial<CouponFormData>
  action: (data: {
    code: string
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
    minOrderAmount?: number | null
    maxUses?: number | null
    expiresAt?: string | null
    isActive: boolean
  }) => Promise<void>
  submitLabel: string
}

export function CouponForm({ initial, action, submitLabel }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState(initial?.code ?? '')
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>(initial?.type ?? 'PERCENTAGE')
  const [value, setValue] = useState(initial?.value?.toString() ?? '')
  const [minOrderAmount, setMinOrderAmount] = useState(initial?.minOrderAmount ?? '')
  const [maxUses, setMaxUses] = useState(initial?.maxUses ?? '')
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await action({
          code: code.trim().toUpperCase(),
          type,
          value: parseFloat(value),
          minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
          maxUses: maxUses ? parseInt(maxUses, 10) : null,
          expiresAt: expiresAt || null,
          isActive,
        })
      } catch {
        setError('Failed to save coupon. Check for duplicate codes.')
      }
    })
  }

  const valueLabel = type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount ($)'
  const valuePlaceholder = type === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 5.00'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Code */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          maxLength={50}
          placeholder="e.g. SUMMER20"
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="PERCENTAGE">Percentage off</option>
          <option value="FIXED_AMOUNT">Fixed amount off</option>
        </select>
      </div>

      {/* Value */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {valueLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          min={0.01}
          max={type === 'PERCENTAGE' ? 100 : undefined}
          step="0.01"
          placeholder={valuePlaceholder}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Min order amount + Max uses */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Min. Order Amount ($)
          </label>
          <input
            type="number"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            min={0.01}
            step="0.01"
            placeholder="No minimum"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Max Uses</label>
          <input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            min={1}
            step={1}
            placeholder="Unlimited"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Expires at */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Expiry Date</label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-400">Leave blank for no expiry</p>
      </div>

      {/* Active */}
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Active
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
