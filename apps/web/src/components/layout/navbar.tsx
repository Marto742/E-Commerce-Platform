'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X, Store, User, LogOut, Package, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
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

function UserMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!session?.user) {
    return (
      <Link
        href="/auth/login"
        className="hidden h-8 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
      >
        Sign in
      </Link>
    )
  }

  const initials =
    `${session.user.firstName?.[0] ?? ''}${session.user.lastName?.[0] ?? ''}`.toUpperCase() ||
    session.user.email?.[0]?.toUpperCase() ||
    '?'

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account menu"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-md border bg-background shadow-lg">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              {session.user.firstName} {session.user.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
            >
              <Settings className="size-4" />
              Account
            </Link>
            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
            >
              <Package className="size-4" />
              Orders
            </Link>
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
            >
              <User className="size-4" />
              Profile
            </Link>
          </div>
          <div className="border-t py-1">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-accent"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const itemCount = useCartItemCount()
  const { open: openCart } = useCartDrawer()

  const [mobileOpen, setMobileOpen] = useState(false)

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

        {/* Search */}
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

          <UserMenu />

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
          mobileOpen ? 'max-h-72' : 'max-h-0 border-transparent'
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
          {session?.user ? (
            <>
              <Link
                href="/account"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Account
              </Link>
              <Link
                href="/orders"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Orders
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-accent"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="mt-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
