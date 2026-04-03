'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@repo/ui'
import { Button } from '@repo/ui'
import { useCartItemCount } from '@/store/cart'
import { useCartDrawer } from '@/components/cart/cart-drawer-context'
import { SearchBar } from '@/components/ui/search-bar'

const NAV_LINKS = [
  { href: '/products', label: 'All Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/deals', label: 'Deals' },
]

export function Navbar() {
  const pathname = usePathname()
  const itemCount = useCartItemCount()
  const { open: openCart } = useCartDrawer()

  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-foreground">
          <Store className="size-5 text-primary" />
          <span className="text-lg tracking-tight">ShopName</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-foreground',
                isActive(link.href) ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="mt-0.5 block h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        {/* Search — grows to fill available space when open */}
        <SearchBar className="relative flex flex-1 items-center justify-end" />

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
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
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground',
                isActive(link.href) ? 'bg-accent/50 text-foreground' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/auth/login"
            className="mt-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
