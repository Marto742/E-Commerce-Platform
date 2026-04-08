import { cookies } from 'next/headers'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'

/**
 * Server-side fetch that forwards the access_token cookie as a Bearer token.
 * Use only in Server Components and Server Actions.
 */
export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`)
  }

  return res.json() as Promise<T>
}
