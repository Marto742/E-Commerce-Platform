'use client'

import { useActionState, useState } from 'react'

interface AttributeEntry {
  key: string
  value: string
}

interface VariantValues {
  sku?: string
  name?: string
  price?: string | number
  stock?: number
  attributes?: Record<string, unknown>
  isActive?: boolean
}

interface Props {
  action: (prev: string | null, formData: FormData) => Promise<string | null>
  defaultValues?: VariantValues
  submitLabel: string
  onCancel?: () => void
}

export function VariantForm({ action, defaultValues = {}, submitLabel, onCancel }: Props) {
  const [error, formAction, isPending] = useActionState(action, null)

  const initialAttrs: AttributeEntry[] = Object.entries(defaultValues.attributes ?? {}).map(
    ([key, value]) => ({ key, value: String(value) })
  )
  const [attrs, setAttrs] = useState<AttributeEntry[]>(
    initialAttrs.length > 0 ? initialAttrs : [{ key: '', value: '' }]
  )

  function addAttr() {
    setAttrs((prev) => [...prev, { key: '', value: '' }])
  }

  function removeAttr(i: number) {
    setAttrs((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateAttr(i: number, field: 'key' | 'value', val: string) {
    setAttrs((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: val } : a)))
  }

  const attributesJson = JSON.stringify(
    Object.fromEntries(attrs.filter((a) => a.key.trim()).map((a) => [a.key.trim(), a.value]))
  )

  return (
    <form action={formAction} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            defaultValue={defaultValues.name ?? ''}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            name="sku"
            required
            defaultValue={defaultValues.sku ?? ''}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Price <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">$</span>
            <input
              name="price"
              required
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues.price ?? ''}
              className="block w-full rounded-md border border-slate-300 py-1.5 pl-5 pr-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Stock</label>
          <input
            name="stock"
            type="number"
            min="0"
            defaultValue={defaultValues.stock ?? 0}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Attributes (key-value pairs) */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-slate-600">Attributes</label>
          <button
            type="button"
            onClick={addAttr}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {attrs.map((attr, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="key (e.g. color)"
                value={attr.key}
                onChange={(e) => updateAttr(i, 'key', e.target.value)}
                className="w-1/2 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="value (e.g. red)"
                value={attr.value}
                onChange={(e) => updateAttr(i, 'value', e.target.value)}
                className="w-1/2 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeAttr(i)}
                className="shrink-0 text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <input type="hidden" name="attributes" value={attributesJson} />

      {/* Active toggle */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={defaultValues.isActive !== false}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        Active
      </label>
      <input type="hidden" name="isActive" value="false" />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
