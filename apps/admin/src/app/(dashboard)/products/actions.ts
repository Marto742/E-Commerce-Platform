'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/server-fetch'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductPayload {
  name: string
  slug: string
  description?: string
  categoryId: string
  basePrice: string
  comparePrice?: string
  isActive: boolean
  isFeatured: boolean
}

interface VariantPayload {
  sku: string
  name: string
  price: string
  stock: number
  attributes: Record<string, string>
  isActive: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractProductPayload(formData: FormData): ProductPayload {
  return {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: (formData.get('description') as string) || undefined,
    categoryId: formData.get('categoryId') as string,
    basePrice: formData.get('basePrice') as string,
    comparePrice: (formData.get('comparePrice') as string) || undefined,
    isActive: formData.get('isActive') === 'true',
    isFeatured: formData.get('isFeatured') === 'true',
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProductAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  let productId: string
  try {
    const payload = extractProductPayload(formData)
    const res = await serverFetch<{ data: { id: string } }>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    productId = res.data.id
  } catch (err) {
    return errorMessage(err)
  }

  revalidatePath('/products')
  redirect(`/products/${productId}/edit`)
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateProductAction(
  productId: string,
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    const payload = extractProductPayload(formData)
    await serverFetch(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (err) {
    return errorMessage(err)
  }

  revalidatePath('/products')
  revalidatePath(`/products/${productId}/edit`)
  return null
}

// ─── Delete product ───────────────────────────────────────────────────────────

export async function deleteProductAction(productId: string): Promise<string | null> {
  try {
    await serverFetch(`/products/${productId}`, { method: 'DELETE' })
  } catch (err) {
    return errorMessage(err)
  }

  revalidatePath('/products')
  redirect('/products')
}

// ─── Variant actions ──────────────────────────────────────────────────────────

function extractVariantPayload(formData: FormData): VariantPayload {
  const attributesRaw = formData.get('attributes') as string
  let attributes: Record<string, string> = {}
  try {
    attributes = attributesRaw ? (JSON.parse(attributesRaw) as Record<string, string>) : {}
  } catch {
    attributes = {}
  }

  return {
    sku: formData.get('sku') as string,
    name: formData.get('name') as string,
    price: formData.get('price') as string,
    stock: Number(formData.get('stock') ?? 0),
    attributes,
    isActive: formData.get('isActive') === 'true',
  }
}

export async function createVariantAction(
  productId: string,
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    const payload = extractVariantPayload(formData)
    await serverFetch(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (err) {
    return errorMessage(err)
  }

  revalidatePath(`/products/${productId}/edit`)
  return null
}

export async function updateVariantAction(
  productId: string,
  variantId: string,
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    const payload = extractVariantPayload(formData)
    await serverFetch(`/products/${productId}/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  } catch (err) {
    return errorMessage(err)
  }

  revalidatePath(`/products/${productId}/edit`)
  return null
}

export async function deleteVariantAction(
  productId: string,
  variantId: string
): Promise<string | null> {
  try {
    await serverFetch(`/products/${productId}/variants/${variantId}`, { method: 'DELETE' })
  } catch (err) {
    return errorMessage(err)
  }

  revalidatePath(`/products/${productId}/edit`)
  return null
}
