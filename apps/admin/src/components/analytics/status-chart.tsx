'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface StatusEntry {
  status: string
  count: number
}

interface StatusChartProps {
  data: StatusEntry[]
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PROCESSING: '#6366f1',
  SHIPPED: '#a855f7',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
  REFUNDED: '#94a3b8',
}

function capitalize(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

export function StatusChart({ data }: StatusChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No orders yet.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: capitalize(d.status),
    value: d.count,
    status: d.status,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [Number(value), 'Orders']}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 11, color: '#64748b' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
