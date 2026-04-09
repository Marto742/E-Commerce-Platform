'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/server-fetch'

export async function createCouponAction(data: {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  minOrderAmount?: number | null
  maxUses?: number | null
  expiresAt?: string | null
  isActive: boolean
}) {
  await serverFetch('/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/coupons')
  redirect('/coupons')
}

export async function updateCouponAction(
  id: string,
  data: {
    code?: string
    type?: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value?: number
    minOrderAmount?: number | null
    maxUses?: number | null
    expiresAt?: string | null
    isActive?: boolean
  }
) {
  await serverFetch(`/coupons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  revalidatePath('/coupons')
  redirect('/coupons')
}

export async function deleteCouponAction(id: string) {
  await serverFetch(`/coupons/${id}`, { method: 'DELETE' })
  revalidatePath('/coupons')
}
