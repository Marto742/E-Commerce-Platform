import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inventory' }

export default function InventoryPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
      <p className="mt-4 text-sm text-slate-500">
        Inventory management — implemented in Phase 11
      </p>
    </main>
  )
}
