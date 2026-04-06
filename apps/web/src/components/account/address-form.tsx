'use client'

import { useState } from 'react'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { apiFetch, ApiError } from '@/lib/api-client'
import type { Address } from '@/app/account/addresses/page'

interface Props {
  initial: Address | null
  accessToken: string
  onSaved: (address: Address, isNew: boolean) => void
  onCancel: () => void
}

const EMPTY = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  isDefault: false,
}

export function AddressForm({ initial, accessToken, onSaved, onCancel }: Props) {
  const isEdit = !!initial

  const [fields, setFields] = useState({
    line1: initial?.line1 ?? EMPTY.line1,
    line2: initial?.line2 ?? EMPTY.line2,
    city: initial?.city ?? EMPTY.city,
    state: initial?.state ?? EMPTY.state,
    postalCode: initial?.postalCode ?? EMPTY.postalCode,
    country: initial?.country ?? EMPTY.country,
    isDefault: initial?.isDefault ?? EMPTY.isDefault,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const body = {
        line1: fields.line1,
        ...(fields.line2 ? { line2: fields.line2 } : {}),
        city: fields.city,
        state: fields.state,
        postalCode: fields.postalCode,
        country: fields.country,
        isDefault: fields.isDefault,
      }

      const res = isEdit
        ? await apiFetch<{ data: Address }>(`/users/me/addresses/${initial!.id}`, {
            method: 'PATCH',
            accessToken,
            body,
          })
        : await apiFetch<{ data: Address }>('/users/me/addresses', {
            method: 'POST',
            accessToken,
            body,
          })

      onSaved(res.data, !isEdit)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save address.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit address' : 'New address'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-1">
          <label htmlFor="line1" className="block text-sm font-medium text-gray-700">
            Address line 1
          </label>
          <Input
            id="line1"
            required
            value={fields.line1}
            onChange={set('line1')}
            placeholder="123 Main St"
            autoComplete="address-line1"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="line2" className="block text-sm font-medium text-gray-700">
            Address line 2 <span className="text-gray-400">(optional)</span>
          </label>
          <Input
            id="line2"
            value={fields.line2}
            onChange={set('line2')}
            placeholder="Apt, suite, unit…"
            autoComplete="address-line2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <Input
              id="city"
              required
              value={fields.city}
              onChange={set('city')}
              placeholder="New York"
              autoComplete="address-level2"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <Input
              id="state"
              required
              value={fields.state}
              onChange={set('state')}
              placeholder="NY"
              autoComplete="address-level1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
              Postal code
            </label>
            <Input
              id="postalCode"
              required
              value={fields.postalCode}
              onChange={set('postalCode')}
              placeholder="10001"
              autoComplete="postal-code"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <Input
              id="country"
              required
              value={fields.country}
              onChange={set('country')}
              placeholder="US"
              autoComplete="country"
              maxLength={2}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={fields.isDefault}
            onChange={(e) => setFields((prev) => ({ ...prev, isDefault: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Set as default address</span>
        </label>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add address'}
          </Button>
        </div>
      </form>
    </section>
  )
}
