import type { Metadata } from 'next'
import Link from 'next/link'
import { serverFetch } from '@/lib/server-fetch'
import { ProductForm } from '@/components/products/product-form'
import { createProductAction } from '../actions'

export const metadata: Metadata = { title: 'New Product' }

interface Category {
  id: string
  name: string
}

export default async function NewProductPage() {
  let categories: Category[] = []
  try {
    const res = await serverFetch<{ data: Category[] }>('/categories?flat=true')
    categories = res.data
  } catch {
    // non-fatal — form still renders with empty category list
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/products" className="text-sm text-slate-500 hover:text-slate-700">
          ← Products
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">New product</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProductForm
          categories={categories}
          action={createProductAction}
          submitLabel="Create Product"
        />
      </div>
    </div>
  )
}
