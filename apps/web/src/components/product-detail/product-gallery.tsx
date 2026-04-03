'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@repo/ui'
import type { ProductImage } from '@/types/api'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

interface LightboxProps {
  images: ProductImage[]
  activeIndex: number
  productName: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function Lightbox({ images, activeIndex, productName, onClose, onPrev, onNext }: LightboxProps) {
  const activeImage = images[activeIndex]!

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    if (Math.abs(dx) > 50) {
      dx < 0 ? onNext() : onPrev()
    }
    touchStartX.current = null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <X className="size-5" />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Previous image"
          disabled={activeIndex === 0}
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* Main image — click inside stops propagation so clicking the image
          itself doesn't close the lightbox */}
      <div
        className="relative mx-16 max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        style={{ aspectRatio: '1 / 1', width: 'min(90vw, 90vh)' }}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.altText ?? productName}
          fill
          className="object-contain"
          sizes="90vw"
          priority
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Next image"
          disabled={activeIndex === images.length - 1}
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
          {activeIndex + 1} / {images.length}
        </p>
      )}
    </div>
  )
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const prev = useCallback(() => setActiveIndex((i) => Math.max(i - 1, 0)), [])
  const next = useCallback(
    () => setActiveIndex((i) => Math.min(i + 1, images.length - 1)),
    [images.length]
  )

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxOpen) {
        if (e.key === 'Escape') setLightboxOpen(false)
        if (e.key === 'ArrowLeft') prev()
        if (e.key === 'ArrowRight') next()
      } else {
        if (e.key === 'ArrowLeft') prev()
        if (e.key === 'ArrowRight') next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, prev, next])

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [lightboxOpen])

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted text-6xl">
        📦
      </div>
    )
  }

  const activeImage = images[activeIndex]!

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
          <Image
            src={activeImage.url}
            alt={activeImage.altText ?? productName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Zoom overlay */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10"
            aria-label="Open image zoom"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-3.5" />
              Zoom
            </span>
          </button>

          {/* Prev / Next arrows (visible on mobile always, on desktop on hover) */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                disabled={activeIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow transition-opacity disabled:opacity-0 group-hover:opacity-100 md:opacity-0"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={next}
                disabled={activeIndex === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow transition-opacity disabled:opacity-0 group-hover:opacity-100 md:opacity-0"
                aria-label="Next image"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}

          {/* Dot indicators for mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 md:hidden">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'size-1.5 rounded-full transition-colors',
                    i === activeIndex ? 'bg-white' : 'bg-white/50'
                  )}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
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
                aria-pressed={i === activeIndex}
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

      {/* Lightbox portal */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          activeIndex={activeIndex}
          productName={productName}
          onClose={() => setLightboxOpen(false)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  )
}
