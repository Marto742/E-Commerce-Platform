import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { User, ShoppingBag, Heart, MapPin, Shield } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard' }

const QUICK_LINKS = [
  {
    href: '/orders',
    icon: ShoppingBag,
    label: 'My Orders',
    description: 'Track and manage your orders',
  },
  {
    href: '/account/wishlist',
    icon: Heart,
    label: 'Wishlist',
    description: 'Items you saved for later',
  },
  {
    href: '/account/addresses',
    icon: MapPin,
    label: 'Addresses',
    description: 'Manage your delivery addresses',
  },
  {
    href: '/account/security',
    icon: Shield,
    label: 'Security',
    description: 'Password and account security',
  },
]

export default async function AccountDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const firstName = session.user.firstName ?? session.user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-gray-500">{session.user.email}</p>
      </div>

      {/* Account summary card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={firstName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-indigo-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {session.user.firstName && session.user.lastName
                ? `${session.user.firstName} ${session.user.lastName}`
                : (session.user.name ?? 'Account')}
            </p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {session.user.status ?? 'Active'}
            </span>
          </div>
          <div className="ml-auto">
            <Link
              href="/account/profile"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Edit profile
            </Link>
          </div>
        </div>
      </div>

      {/* Quick links grid */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_LINKS.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-indigo-100">
                <Icon className="h-5 w-5 text-gray-600 transition-colors group-hover:text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
