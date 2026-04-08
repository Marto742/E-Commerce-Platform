import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Returns' }

export default function ReturnsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Returns</h1>
      <p className="mt-4 text-sm text-slate-500">Returns — implemented in Phase 11</p>
    </div>
  )
}
