import type { Metadata } from 'next'
import { AccountSidebar } from '@/components/account/account-sidebar'

export const metadata: Metadata = {
  title: {
    default: 'My Account',
    template: '%s | My Account',
  },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <AccountSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
