import type { Metadata } from 'next'
import Link from 'next/link'
import { serverFetch } from '@/lib/server-fetch'
import { DeleteCategoryButton } from './delete-button'

export const metadata: Metadata = { title: 'Categories' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
  sortOrder: number
  imageUrl: string | null
  parentId: string | null
  _count: { products: number }
  children?: Category[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoriesPage() {
  let roots: Category[] = []
  try {
    const res = await serverFetch<{ data: Category[] }>('/categories')
    roots = res.data
  } catch {
    // handled below
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">{countAll(roots)} total</p>
        </div>
        <Link
          href="/categories/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add Category
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {roots.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-400">
            No categories yet. Create one to get started.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 font-medium text-slate-600">Slug</th>
                <th className="px-4 py-3 font-medium text-slate-600">Products</th>
                <th className="px-4 py-3 font-medium text-slate-600">Order</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roots.flatMap((root) => renderRows(root, 0))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countAll(cats: Category[]): number {
  return cats.reduce((sum, c) => sum + 1 + countAll(c.children ?? []), 0)
}

function renderRows(cat: Category, depth: number): React.ReactNode[] {
  const rows: React.ReactNode[] = [
    <tr key={cat.id} className="hover:bg-slate-50">
      {/* Name — indented by depth */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
          {depth > 0 && <span className="text-slate-300">└</span>}
          <span className={`font-medium ${depth === 0 ? 'text-slate-900' : 'text-slate-700'}`}>
            {cat.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
      <td className="px-4 py-3 text-slate-600">{cat._count.products}</td>
      <td className="px-4 py-3 text-slate-500">{cat.sortOrder}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            cat.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {cat.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/categories/${cat.id}/edit`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Edit
          </Link>
          <DeleteCategoryButton id={cat.id} name={cat.name} productCount={cat._count.products} />
        </div>
      </td>
    </tr>,
  ]

  for (const child of cat.children ?? []) {
    rows.push(...renderRows(child, depth + 1))
  }

  return rows
}
