import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchProductBySlug } from '@/lib/server-api'
import {
  ProductDetailView,
  ProductDetailSkeleton,
} from '@/components/product-detail/product-detail-view'
import { Suspense } from 'react'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProductBySlug(slug)

  if (!product) {
    return { title: 'Product not found' }
  }

  const image = product.images[0]
  const price = parseFloat(product.basePrice)
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)

  const title = product.name
  const description =
    product.description?.slice(0, 155) ??
    `${product.name} — ${formattedPrice}. Shop now at ShopName.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${APP_URL}/products/${slug}`,
      images: image
        ? [
            {
              url: image.url,
              alt: image.altText ?? title,
              width: 800,
              height: 800,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image.url] : [],
    },
    alternates: {
      canonical: `${APP_URL}/products/${slug}`,
    },
    other: {
      // Product structured data will be injected by ProductDetailView
      'product:price:amount': String(price),
      'product:price:currency': 'USD',
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await fetchProductBySlug(slug)

  if (!product) notFound()

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailView product={product} />
    </Suspense>
  )
}
