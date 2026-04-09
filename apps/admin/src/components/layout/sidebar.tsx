'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BarChart3,
  Box,
  ChevronLeft,
  Folders,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  RotateCcw,
  Settings,
  Tag,
  Tags,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Box },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/orders', label: 'Orders', icon: PackageCheck },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Folders },
  { href: '/coupons', label: 'Coupons', icon: Tag },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/returns', label: 'Returns', icon: RotateCcw },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  lowStockCount?: number
}

export function Sidebar({ lowStockCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-sidebar-border">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="px-2 text-lg font-bold text-white hover:opacity-80 transition-opacity"
          >
            ShopAdmin
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'rounded-md p-1.5 text-sidebar-foreground hover:bg-white/10 hover:text-white transition-colors',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          const badge = href === '/inventory' && lowStockCount > 0 ? lowStockCount : null
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-sidebar-active-foreground'
                  : 'text-sidebar-foreground hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {badge !== null && (
                    <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Log out' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-white/10 hover:text-white',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  )
}
