import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { AddressBook } from '@/components/account/address-book'

export const metadata: Metadata = { title: 'Addresses' }

export interface Address {
  id: string
  line1: string
  line2: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: string
}

interface AddressesResponse {
  data: Address[]
}

export default async function AddressesPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login?callbackUrl=/account/addresses')

  let addresses: Address[] = []

  try {
    const res = await apiFetch<AddressesResponse>('/users/me/addresses', {
      method: 'GET',
      accessToken: session.accessToken,
    })
    addresses = res.data
  } catch {
    // render with empty list — AddressBook shows an error state
    addresses = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Address book</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your saved delivery addresses.</p>
      </div>
      <AddressBook initialAddresses={addresses} accessToken={session.accessToken} />
    </div>
  )
}
