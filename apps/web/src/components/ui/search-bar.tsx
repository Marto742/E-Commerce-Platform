'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, ArrowRight } from 'lucide-react'
import { cn } from '@repo/ui'
import { Button } from '@repo/ui'
import { useSearchSuggestions } from '@/hooks/use-search-suggestions'

function formatPrice(price: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(price)
  )
}

interface SearchBarProps {
  className?: string
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isFetching } = useSearchSuggestions(query)
  const suggestions = useMemo(() => data?.data ?? [], [data])
  const showDropdown = open && query.trim().length >= 2

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  // Close on Escape or outside click
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  function close() {
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      router.push(`/products/${suggestions[activeIndex].slug}`)
    } else {
      router.push(`/products?search=${encodeURIComponent(q)}`)
    }
    close()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    }
  }

  // "See all results" is the item after the last suggestion
  const allResultsIndex = suggestions.length

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {open ? (
        <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products…"
            autoComplete="off"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {isFetching && (
            <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-muted border-t-primary" />
          )}
          <button
            type="button"
            onClick={close}
            className="ml-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close search"
          >
            <X className="size-4" />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-background shadow-lg">
              {suggestions.length === 0 && !isFetching ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No products found.</p>
              ) : (
                <ul role="listbox">
                  {suggestions.map((product, i) => {
                    const image = product.images?.[0]
                    return (
                      <li key={product.id} role="option" aria-selected={activeIndex === i}>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={close}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                            activeIndex === i ? 'bg-accent text-foreground' : 'hover:bg-accent/60'
                          )}
                          onMouseEnter={() => setActiveIndex(i)}
                        >
                          {/* Thumbnail */}
                          <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            {image ? (
                              <Image
                                src={image.url}
                                alt={image.altText ?? product.name}
                                width={40}
                                height={40}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="size-full" />
                            )}
                          </div>

                          {/* Name + category */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{product.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {product.category?.name}
                            </p>
                          </div>

                          {/* Price */}
                          <span className="shrink-0 font-medium text-foreground">
                            {formatPrice(product.basePrice)}
                          </span>
                        </Link>
                      </li>
                    )
                  })}

                  {/* See all results row */}
                  <li role="option" aria-selected={activeIndex === allResultsIndex}>
                    <Link
                      href={`/products?search=${encodeURIComponent(query.trim())}`}
                      onClick={close}
                      className={cn(
                        'flex items-center justify-between border-t px-4 py-2.5 text-sm font-medium text-primary transition-colors',
                        activeIndex === allResultsIndex ? 'bg-accent' : 'hover:bg-accent/60'
                      )}
                      onMouseEnter={() => setActiveIndex(allResultsIndex)}
                    >
                      <span>See all results for &ldquo;{query.trim()}&rdquo;</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          )}
        </form>
      ) : (
        <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setOpen(true)}>
          <Search />
        </Button>
      )}
    </div>
  )
}
