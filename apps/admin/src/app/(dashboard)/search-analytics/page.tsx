import type { Metadata } from 'next'
import { serverFetch } from '@/lib/server-fetch'
import { StatCard } from '@/components/dashboard/stat-card'

export const metadata: Metadata = { title: 'Search Analytics' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchAnalytics {
  periodDays: number
  summary: {
    totalSearches: number
    uniqueQueries: number
    zeroResultSearches: number
    zeroResultRate: number
  }
  topQueries: { query: string; count: number; avgResults: number }[]
  zeroResultQueries: { query: string; count: number }[]
}

interface ApiResponse {
  data: SearchAnalytics
}

const PERIODS = [7, 30, 90] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ days?: string }>
}

export default async function SearchAnalyticsPage({ searchParams }: Props) {
  const { days = '30' } = await searchParams

  let analytics: SearchAnalytics | null = null
  try {
    const res = await serverFetch<ApiResponse>(`/admin/analytics/search?days=${days}`)
    analytics = res.data
  } catch {
    // handled below
  }

  if (!analytics) {
    return (
      <div className="max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Search Analytics</h1>
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400">
          Could not load search analytics.
        </p>
      </div>
    )
  }

  const { summary, topQueries, zeroResultQueries } = analytics

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search Analytics</h1>
          <p className="text-sm text-slate-500">Last {analytics.periodDays} days</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <a
              key={p}
              href={`/search-analytics?days=${p}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                Number(days) === p
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}d
            </a>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total searches"
          value={summary.totalSearches.toLocaleString()}
          sub="in period"
        />
        <StatCard
          label="Unique queries"
          value={summary.uniqueQueries.toLocaleString()}
          sub="distinct terms"
        />
        <StatCard
          label="Zero-result searches"
          value={summary.zeroResultSearches.toLocaleString()}
          sub="no products matched"
        />
        <StatCard
          label="Zero-result rate"
          value={`${summary.zeroResultRate}%`}
          sub="of all searches"
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top searches */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Top searches</h2>
          </div>
          {topQueries.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-400">
              No searches recorded yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">Query</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">Searches</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">Avg results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topQueries.map((row) => (
                  <tr key={row.query} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-700">{row.query}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                      {row.count}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                      {row.avgResults}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Zero-result searches */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Zero-result searches</h2>
            <p className="text-xs text-slate-400">Opportunities for new products or synonyms</p>
          </div>
          {zeroResultQueries.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-400">
              No failed searches — nice.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">Query</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">Searches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zeroResultQueries.map((row) => (
                  <tr key={row.query} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-700">{row.query}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
