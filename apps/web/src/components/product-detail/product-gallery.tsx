'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@repo/ui'
import type { ProductImage } from '@/types/api'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted text-6xl">
        📦
      </div>
    )
  }

  const activeImage = images[activeIndex]

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
        <Image
          src={activeImage.url}
          alt={activeImage.altText ?? productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                i === activeIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground/40'
              )}
              aria-label={img.altText ?? `Image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${productName} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
