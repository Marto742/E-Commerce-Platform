'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@repo/ui'
import { StarRating } from '@/components/ui/star-rating'
import type { SearchHit } from '@/types/api'

interface SearchHitCardProps {
  hit: SearchHit
  className?: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

export function SearchHitCard({ hit, className }: SearchHitCardProps) {
  return (
    <Link
      href={`/products/${hit.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {hit.imageUrl ? (
          <Image
            src={hit.imageUrl}
            alt={hit.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-muted" />
        )}
        {!hit.inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Out of stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs text-muted-foreground">{hit.categoryName}</p>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {hit.name}
        </p>
        {hit.reviewCount > 0 && (
          <span className="flex items-center gap-1">
            <StarRating rating={hit.rating} size="sm" />
            <span className="text-xs text-muted-foreground">({hit.reviewCount})</span>
          </span>
        )}
        <div className="mt-auto pt-2">
          {hit.comparePrice && hit.comparePrice > hit.basePrice ? (
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-foreground">{formatPrice(hit.basePrice)}</span>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(hit.comparePrice)}
              </span>
            </div>
          ) : (
            <span className="font-semibold text-foreground">{formatPrice(hit.basePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
