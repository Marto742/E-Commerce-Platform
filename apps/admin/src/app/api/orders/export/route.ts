import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  const res = await fetch(`${API_BASE}/admin/orders/export`, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Export failed' }, { status: res.status })
  }

  const csv = await res.text()
  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
