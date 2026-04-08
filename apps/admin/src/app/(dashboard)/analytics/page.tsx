import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
      <p className="mt-4 text-sm text-slate-500">Analytics — implemented in Phase 11</p>
    </div>
  )
}
