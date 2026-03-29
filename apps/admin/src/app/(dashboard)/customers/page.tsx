import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Customers' }

export default function CustomersPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
      <p className="mt-4 text-sm text-slate-500">
        Customers table — implemented in Phase 11
      </p>
    </main>
  )
}
