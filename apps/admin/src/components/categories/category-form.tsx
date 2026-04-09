'use client'

import { useState, useTransition } from 'react'

export interface CategoryFormData {
  name: string
  slug: string
  imageUrl: string
  parentId: string
  isActive: boolean
  sortOrder: number
}

interface FlatCategory {
  id: string
  name: string
  parentId: string | null
}

interface Props {
  initial?: Partial<CategoryFormData>
  categories: FlatCategory[]
  /** id of category being edited — excluded from parent options */
  editingId?: string
  action: (data: {
    name: string
    slug: string
    imageUrl?: string
    parentId?: string
    isActive: boolean
    sortOrder: number
  }) => Promise<void>
  submitLabel: string
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CategoryForm({ initial, categories, editingId, action, submitLabel }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [parentId, setParentId] = useState(initial?.parentId ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0)
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug)

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(toSlug(value))
  }

  // Exclude self and any descendant from parent options
  const descendantIds = new Set<string>()
  if (editingId) {
    descendantIds.add(editingId)
    let changed = true
    while (changed) {
      changed = false
      for (const c of categories) {
        if (!descendantIds.has(c.id) && c.parentId && descendantIds.has(c.parentId)) {
          descendantIds.add(c.id)
          changed = true
        }
      }
    }
  }
  const parentOptions = categories.filter((c) => !descendantIds.has(c.id))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await action({
          name: name.trim(),
          slug: slug.trim(),
          imageUrl: imageUrl.trim() || undefined,
          parentId: parentId || undefined,
          isActive,
          sortOrder,
        })
      } catch {
        setError('Failed to save category. Check for duplicate slugs.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setSlugTouched(true)
          }}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-400">Used in URLs — must be unique</p>
      </div>

      {/* Parent */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Parent Category</label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— None (root category) —</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Image URL */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Image URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Sort order + Active */}
      <div className="flex gap-4">
        <div className="w-32">
          <label className="mb-1 block text-sm font-medium text-slate-700">Sort Order</label>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end pb-2">
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
