'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/server-fetch'

export async function createCategoryAction(data: {
  name: string
  slug: string
  imageUrl?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
}) {
  await serverFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/categories')
  redirect('/categories')
}

export async function updateCategoryAction(
  id: string,
  data: {
    name?: string
    slug?: string
    imageUrl?: string
    parentId?: string
    isActive?: boolean
    sortOrder?: number
  }
) {
  await serverFetch(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  revalidatePath('/categories')
  redirect('/categories')
}

export async function deleteCategoryAction(id: string) {
  await serverFetch(`/categories/${id}`, { method: 'DELETE' })
  revalidatePath('/categories')
}
