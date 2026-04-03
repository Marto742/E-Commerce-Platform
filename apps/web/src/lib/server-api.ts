// Server-only fetch helpers used in generateMetadata and server components.
// These bypass React Query and the browser-only api-client.

import type { Product } from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/slug/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data: Product }
    return json.data
  } catch {
    return null
  }
}
