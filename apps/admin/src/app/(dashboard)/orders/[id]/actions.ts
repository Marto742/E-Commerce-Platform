'use server'

import { revalidatePath } from 'next/cache'
import { serverFetch } from '@/lib/server-fetch'

export async function updateOrderStatus(orderId: string, status: string) {
  await serverFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
}

export async function updateTrackingNumber(orderId: string, trackingNumber: string) {
  await serverFetch(`/orders/${orderId}/tracking`, {
    method: 'PATCH',
    body: JSON.stringify({ trackingNumber }),
  })
  revalidatePath(`/orders/${orderId}`)
}

export async function processRefund(orderId: string, reason: string) {
  await serverFetch(`/orders/${orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || undefined }),
  })
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
}
