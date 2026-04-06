import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/account/profile-form'

export const metadata: Metadata = { title: 'Edit Profile' }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login?callbackUrl=/account/profile')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit profile</h1>
        <p className="mt-1 text-sm text-gray-500">Update your personal information.</p>
      </div>
      <ProfileForm
        initialValues={{
          firstName: session.user.firstName ?? '',
          lastName: session.user.lastName ?? '',
          email: session.user.email ?? '',
          avatarUrl: session.user.avatarUrl ?? '',
        }}
        accessToken={session.accessToken}
      />
    </div>
  )
}
