'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, ShoppingBag, Heart, MapPin, Shield, LogOut } from 'lucide-react'
import { cn } from '@repo/ui'

const NAV_ITEMS = [
  { href: '/account', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/orders', icon: ShoppingBag, label: 'Orders', exact: false },
  { href: '/account/wishlist', icon: Heart, label: 'Wishlist', exact: false },
  { href: '/account/addresses', icon: MapPin, label: 'Addresses', exact: false },
  { href: '/account/security', icon: Shield, label: 'Security', exact: false },
]

export function AccountSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="w-full lg:w-56 lg:shrink-0">
      <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(href, exact)
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="mt-auto flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 lg:mt-4"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </nav>
    </aside>
  )
}
