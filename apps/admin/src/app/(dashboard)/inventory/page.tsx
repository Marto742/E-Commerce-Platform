import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inventory' }

export default function InventoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
      <p className="mt-4 text-sm text-slate-500">Inventory — implemented in Phase 11</p>
    </div>
  )
}
