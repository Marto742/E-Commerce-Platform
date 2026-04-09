import type { Metadata } from 'next'
import Link from 'next/link'
import { serverFetch } from '@/lib/server-fetch'
import { CategoryForm } from '@/components/categories/category-form'
import { createCategoryAction } from '../actions'

export const metadata: Metadata = { title: 'New Category' }

interface FlatCategory {
  id: string
  name: string
  parentId: string | null
}

export default async function NewCategoryPage() {
  let categories: FlatCategory[] = []
  try {
    const res = await serverFetch<{ data: FlatCategory[] }>('/categories?flat=true')
    categories = res.data
  } catch {
    // non-fatal
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/categories" className="text-sm text-slate-500 hover:text-slate-700">
          ← Categories
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">New Category</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CategoryForm
          categories={categories}
          action={createCategoryAction}
          submitLabel="Create Category"
        />
      </div>
    </div>
  )
}
