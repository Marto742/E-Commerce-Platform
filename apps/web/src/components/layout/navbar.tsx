'use client'

import Link from 'next/link'
import { ShoppingCart, Search, Menu, X, Store } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@repo/ui'
import { Button } from '@repo/ui'
import { useCartItemCount } from '@/store/cart'
import { useCartDrawer } from '@/components/cart/cart-drawer-context'

const NAV_LINKS = [
  { href: '/products', label: 'All Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/deals', label: 'Deals' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const itemCount = useCartItemCount()
  const { open: openCart } = useCartDrawer()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
          <Store className="size-5 text-primary" />
          <span className="text-lg tracking-tight">ShopName</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search />
          </Button>

          <button
            onClick={openCart}
            aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShoppingCart className="size-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          <Link
            href="/auth/login"
            className="hidden h-8 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
          >
            Sign in
          </Link>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t transition-all duration-200 md:hidden',
          mobileOpen ? 'max-h-64' : 'max-h-0 border-transparent'
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="mt-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
