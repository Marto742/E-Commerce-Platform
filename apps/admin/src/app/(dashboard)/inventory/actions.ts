'use server'

import { revalidatePath } from 'next/cache'
import { serverFetch } from '@/lib/server-fetch'

export interface StockUpdate {
  variantId: string
  operation: 'set' | 'add' | 'subtract'
  quantity: number
}

export async function bulkUpdateStock(updates: StockUpdate[]) {
  const result = await serverFetch<{ data: unknown[] }>('/inventory/bulk', {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  })
  revalidatePath('/inventory')
  return result
}
