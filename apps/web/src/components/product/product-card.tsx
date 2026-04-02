'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star } from 'lucide-react'
import { cn } from '@repo/ui'
import { Button } from '@repo/ui'
import { useIsInCart, useCartActions } from '@/store/cart'
import type { ProductListItem } from '@/types/api'

interface ProductCardProps {
  product: ProductListItem
  className?: string
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(parseFloat(price))
}

function DiscountBadge({ base, compare }: { base: string; compare: string }) {
  const pct = Math.round(((parseFloat(compare) - parseFloat(base)) / parseFloat(compare)) * 100)
  if (pct <= 0) return null
  return (
    <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
      -{pct}%
    </span>
  )
}

export function ProductCard({ product, className }: ProductCardProps) {
  const inCart = useIsInCart(product.variants?.[0]?.id ?? product.id)
  const { addItem } = useCartActions()

  const primaryImage = product.images[0]
  const lowestVariantPrice =
    product.variants?.length > 0
      ? product.variants.reduce(
          (min, v) => (parseFloat(v.price) < parseFloat(min) ? v.price : min),
          product.variants[0].price
        )
      : null
  const displayPrice = lowestVariantPrice ?? product.basePrice

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    const firstVariant = product.variants?.[0]
    if (!firstVariant) return
    addItem(
      {
        id: firstVariant.id,
        sku: firstVariant.sku,
        name: firstVariant.name,
        price: firstVariant.price,
        stock: firstVariant.stock,
        attributes: firstVariant.attributes,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          comparePrice: product.comparePrice,
          imageUrl: primaryImage?.url ?? null,
        },
      },
      1
    )
  }

  const hasStock =
    !product.variants || product.variants.length === 0 || product.variants.some((v) => v.stock > 0)

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-card transition-shadow duration-200 hover:shadow-card-hover',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText ?? product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">📦</div>
        )}
        {product.comparePrice && (
          <DiscountBadge base={product.basePrice} compare={product.comparePrice} />
        )}
        {product.isFeatured && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            Featured
          </span>
        )}
        {!hasStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.category.name}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </h3>

        {/* Rating */}
        {product._count.reviews > 0 && (
          <div className="flex items-center gap-1">
            <Star className="size-3 fill-warning text-warning" />
            <span className="text-xs text-muted-foreground">({product._count.reviews})</span>
          </div>
        )}

        {/* Price row */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-foreground">{formatPrice(displayPrice)}</span>
            {product.comparePrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          <Button
            size="icon-sm"
            variant={inCart ? 'secondary' : 'default'}
            onClick={handleAddToCart}
            disabled={!hasStock}
            aria-label={inCart ? 'Already in cart' : 'Add to cart'}
            className="shrink-0"
          >
            <ShoppingCart />
          </Button>
        </div>
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border bg-card shadow-card">
      <div className="aspect-square bg-muted" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="mt-2 flex justify-between">
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="size-8 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
