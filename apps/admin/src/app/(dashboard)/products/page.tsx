import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Products' }

export default function ProductsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Add Product
        </button>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Product table — implemented in Phase 11
      </p>
    </main>
  )
}
