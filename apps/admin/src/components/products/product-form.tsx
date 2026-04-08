'use client'

import { useActionState, useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
}

interface ProductValues {
  name?: string
  slug?: string
  description?: string
  categoryId?: string
  basePrice?: string | number
  comparePrice?: string | number | null
  isActive?: boolean
  isFeatured?: boolean
}

interface Props {
  categories: Category[]
  defaultValues?: ProductValues
  action: (prev: string | null, formData: FormData) => Promise<string | null>
  submitLabel: string
  successMessage?: string
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ProductForm({
  categories,
  defaultValues = {},
  action,
  submitLabel,
  successMessage,
}: Props) {
  const [error, formAction, isPending] = useActionState(action, null)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(defaultValues.name ?? '')
  const [slug, setSlug] = useState(String(defaultValues.slug ?? ''))
  const [slugManual, setSlugManual] = useState(!!defaultValues.slug)

  useEffect(() => {
    if (error === null && !isPending && submitLabel !== 'Create Product') {
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(t)
    }
    return undefined
  }, [error, isPending, submitLabel])

  return (
    <form action={formAction} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Name + Slug */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugManual) setSlug(slugify(e.target.value))
            }}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManual(true)
            }}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaultValues.description ?? ''}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Category + Prices */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="categoryId"
            required
            defaultValue={defaultValues.categoryId ?? ''}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Base price <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-2 text-sm text-slate-400">$</span>
            <input
              name="basePrice"
              required
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues.basePrice ?? ''}
              className="block w-full rounded-md border border-slate-300 py-2 pl-6 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Compare price</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-2 text-sm text-slate-400">$</span>
            <input
              name="comparePrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues.comparePrice ?? ''}
              className="block w-full rounded-md border border-slate-300 py-2 pl-6 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-8">
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
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isFeatured"
            value="true"
            defaultChecked={defaultValues.isFeatured ?? false}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Featured
        </label>
      </div>

      {/* Hidden checkbox workaround — send false when unchecked */}
      <input type="hidden" name="isActive" value="false" />
      <input type="hidden" name="isFeatured" value="false" />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
