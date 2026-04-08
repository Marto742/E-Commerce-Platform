import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/server-fetch'
import { ProductForm } from '@/components/products/product-form'
import { VariantsManager } from '@/components/products/variants-manager'
import { ImageUploader } from '@/components/products/image-uploader'
import { DeleteProductButton } from '@/components/products/delete-product-button'
import { updateProductAction, deleteProductAction } from '../../actions'

export const metadata: Metadata = { title: 'Edit Product' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variant {
  id: string
  name: string
  sku: string
  price: string
  stock: number
  isActive: boolean
  attributes: Record<string, unknown>
}

interface ProductImage {
  id: string
  url: string
  altText: string | null
  sortOrder: number
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: string
  comparePrice: string | null
  isActive: boolean
  isFeatured: boolean
  category: { id: string; name: string }
  variants: Variant[]
  images: ProductImage[]
}

interface Category {
  id: string
  name: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params

  let product: Product | null = null
  let categories: Category[] = []

  try {
    const [productRes, categoriesRes] = await Promise.all([
      serverFetch<{ data: Product }>(`/products/${id}`),
      serverFetch<{ data: Category[] }>('/categories?flat=true'),
    ])
    product = productRes.data
    categories = categoriesRes.data
  } catch {
    notFound()
  }

  if (!product) notFound()

  const boundUpdate = updateProductAction.bind(null, id)
  const boundDelete = deleteProductAction.bind(null, id)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products" className="text-sm text-slate-500 hover:text-slate-700">
            ← Products
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
        </div>
        <DeleteProductButton action={boundDelete} />
      </div>

      {/* Product details */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Product details</h2>
        <ProductForm
          categories={categories}
          defaultValues={{
            name: product.name,
            slug: product.slug,
            description: product.description ?? undefined,
            categoryId: product.category.id,
            basePrice: product.basePrice,
            comparePrice: product.comparePrice,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
          }}
          action={boundUpdate}
          submitLabel="Save changes"
          successMessage="Product saved."
        />
      </div>

      {/* Images */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Images</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ImageUploader productId={id} images={product.images} />
        </div>
      </div>

      {/* Variants */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Variants</h2>
        <VariantsManager productId={id} variants={product.variants} />
      </div>
    </div>
  )
}
