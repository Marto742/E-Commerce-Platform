interface StatCardProps {
  label: string
  value: string
  sub: string
  change?: number | null
}

export function StatCard({ label, value, sub, change }: StatCardProps) {
  const hasChange = change != null
  const positive = hasChange && change >= 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-xs text-slate-400">{sub}</p>
        {hasChange && (
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
              positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {positive ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  )
}
