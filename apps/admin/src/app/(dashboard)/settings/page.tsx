import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-4 text-sm text-slate-500">Settings — implemented in Phase 11</p>
    </div>
  )
}
