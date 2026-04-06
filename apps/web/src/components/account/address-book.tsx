'use client'

import { useState } from 'react'
import { MapPin, Plus, Star, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui'
import { apiFetch, ApiError } from '@/lib/api-client'
import type { Address } from '@/app/account/addresses/page'
import { AddressForm } from './address-form'

interface Props {
  initialAddresses: Address[]
  accessToken: string
}

export function AddressBook({ initialAddresses, accessToken }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Address | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [defaultingId, setDefaultingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    try {
      await apiFetch(`/users/me/addresses/${id}`, { method: 'DELETE', accessToken })
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete address.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSetDefault(id: string) {
    setDefaultingId(id)
    setError(null)
    try {
      await apiFetch(`/users/me/addresses/${id}/default`, { method: 'PATCH', accessToken })
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update default address.')
    } finally {
      setDefaultingId(null)
    }
  }

  function handleSaved(address: Address, isNew: boolean) {
    setAddresses((prev) => {
      const updated = isNew
        ? [...prev, address]
        : prev.map((a) => (a.id === address.id ? address : a))

      // Keep only one default
      if (address.isDefault) {
        return updated.map((a) => ({ ...a, isDefault: a.id === address.id }))
      }
      return updated
    })
    setShowForm(false)
    setEditTarget(null)
  }

  const sorted = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Address cards */}
      {sorted.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
          <MapPin className="mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-500">No saved addresses</p>
          <p className="mb-5 text-sm text-gray-400">Add an address to speed up checkout.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add address
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((address) => (
          <div
            key={address.id}
            className={`relative rounded-xl border bg-white p-5 shadow-sm ${address.isDefault ? 'border-indigo-300 ring-1 ring-indigo-200' : ''}`}
          >
            {address.isDefault && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                <Star className="h-3 w-3" />
                Default
              </span>
            )}

            <address className="not-italic text-sm text-gray-700">
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p>{address.country}</p>
            </address>

            <div className="mt-4 flex flex-wrap gap-2">
              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  disabled={defaultingId === address.id}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  {defaultingId === address.id ? 'Setting…' : 'Set as default'}
                </button>
              )}
              <button
                onClick={() => {
                  setEditTarget(address)
                  setShowForm(true)
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(address.id)}
                disabled={deletingId === address.id}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                {deletingId === address.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new button (when cards are shown) */}
      {sorted.length > 0 && !showForm && (
        <Button
          variant="outline"
          onClick={() => {
            setEditTarget(null)
            setShowForm(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add address
        </Button>
      )}

      {/* Inline form */}
      {showForm && (
        <AddressForm
          initial={editTarget}
          accessToken={accessToken}
          onSaved={handleSaved}
          onCancel={() => {
            setShowForm(false)
            setEditTarget(null)
          }}
        />
      )}
    </div>
  )
}
