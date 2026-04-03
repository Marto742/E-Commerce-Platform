'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Button } from '@repo/ui'
import { cn } from '@repo/ui'
import { StarRating } from '@/components/ui/star-rating'
import { QuantityPicker } from '@/components/ui/quantity-picker'
import { ProductGallery } from './product-gallery'
import { VariantSelector } from './variant-selector'
import { ProductReviews } from './product-reviews'
import { useIsInCart } from '@/store/cart'
import { useCartMutations } from '@/hooks/use-cart-mutations'
import type { Product, ProductVariant } from '@/types/api'

interface ProductDetailViewProps {
  product: Product
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(price)
  )
}

function DiscountBadge({ base, compare }: { base: string; compare: string }) {
  const pct = Math.round(((parseFloat(compare) - parseFloat(base)) / parseFloat(compare)) * 100)
  if (pct <= 0) return null
  return (
    <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
      -{pct}%
    </span>
  )
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const variants = product.variants ?? []
  const images = product.images ?? []

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(variants[0] ?? null)
  const [quantity, setQuantity] = useState(1)

  const { addItem } = useCartMutations()
  const inCart = useIsInCart(selectedVariant?.id ?? '')

  const displayPrice = selectedVariant?.price ?? product.basePrice
  const stock = selectedVariant?.stock ?? 0
  const hasStock = stock > 0
  function handleAddToCart() {
    if (!selectedVariant || !hasStock) return
    addItem(
      {
        id: selectedVariant.id,
        sku: selectedVariant.sku,
        name: selectedVariant.name,
        price: selectedVariant.price,
        stock: selectedVariant.stock,
        attributes: selectedVariant.attributes,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          comparePrice: product.comparePrice,
          imageUrl: images[0]?.url ?? null,
        },
      },
      quantity
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: 'Products', href: '/products' },
          ...(product.category
            ? [
                {
                  label: product.category.name,
                  href: `/products?categoryId=${product.category.id}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <ProductGallery images={images} productName={product.name} />

        {/* Info panel */}
        <div className="flex flex-col gap-5">
          {/* Category + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.category?.name}
            </span>
            {product.isFeatured && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">
            {product.name}
          </h1>

          {/* Review count link */}
          {(product._count?.reviews ?? 0) > 0 && (
            <a
              href="#reviews"
              className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <StarRating rating={null} size="md" />
              {product._count.reviews} review{product._count.reviews !== 1 ? 's' : ''}
            </a>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">{formatPrice(displayPrice)}</span>
            {product.comparePrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </span>
                <DiscountBadge base={displayPrice} compare={product.comparePrice} />
              </>
            )}
          </div>

          {/* Variant selector */}
          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              selectedId={selectedVariant?.id ?? null}
              onSelect={(v) => {
                setSelectedVariant(v)
                setQuantity(1)
              }}
            />
          )}

          {/* Stock status */}
          <p
            className={cn(
              'text-sm font-medium',
              hasStock ? 'text-emerald-600' : 'text-destructive'
            )}
          >
            {hasStock ? `In stock (${stock} available)` : 'Out of stock'}
          </p>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3">
            <QuantityPicker
              value={quantity}
              min={1}
              max={stock}
              disabled={!hasStock}
              onChange={setQuantity}
            />

            <Button
              className="flex-1"
              disabled={!hasStock || !selectedVariant}
              variant={inCart ? 'secondary' : 'default'}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 size-4" />
              {inCart ? 'Added to cart' : 'Add to cart'}
            </Button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t pt-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </h2>
              <p className="text-sm leading-relaxed text-foreground/80">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div id="reviews" className="mt-16">
        <ProductReviews productId={product.id} reviewCount={product._count?.reviews ?? 0} />
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-64 rounded bg-muted" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square rounded-xl bg-muted" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-3/4 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-9 w-40 rounded bg-muted" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-20 rounded-md bg-muted" />
            ))}
          </div>
          <div className="h-12 w-full rounded-md bg-muted" />
          <div className="mt-4 h-24 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
