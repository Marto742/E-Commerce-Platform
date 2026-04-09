import { Sidebar } from '@/components/layout/sidebar'
import { serverFetch } from '@/lib/server-fetch'

interface StockSummary {
  total: number
  outOfStock: number
  lowStock: number
  threshold: number
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let alertCount = 0
  try {
    const res = await serverFetch<{ data: StockSummary }>('/inventory/summary')
    alertCount = res.data.outOfStock + res.data.lowStock
  } catch {
    // sidebar badge is non-critical — fail silently
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar lowStockCount={alertCount} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
