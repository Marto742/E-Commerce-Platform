import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/server-fetch'
import { CategoryForm } from '@/components/categories/category-form'
import { updateCategoryAction } from '../../actions'

export const metadata: Metadata = { title: 'Edit Category' }

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  parentId: string | null
  isActive: boolean
  sortOrder: number
}

interface FlatCategory {
  id: string
  name: string
  parentId: string | null
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params

  const [categoryResult, categoriesResult] = await Promise.allSettled([
    serverFetch<{ data: Category }>(`/categories/${id}`),
    serverFetch<{ data: FlatCategory[] }>('/categories?flat=true'),
  ])

  if (categoryResult.status === 'rejected') notFound()

  const category = categoryResult.value.data
  const allCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : []

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/categories" className="text-sm text-slate-500 hover:text-slate-700">
          ← Categories
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">Edit — {category.name}</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CategoryForm
          initial={{
            name: category.name,
            slug: category.slug,
            imageUrl: category.imageUrl ?? '',
            parentId: category.parentId ?? '',
            isActive: category.isActive,
            sortOrder: category.sortOrder,
          }}
          categories={allCategories}
          editingId={id}
          action={(data) => updateCategoryAction(id, data)}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  )
}
