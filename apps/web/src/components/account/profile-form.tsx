'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { apiFetch, ApiError } from '@/lib/api-client'

interface InitialValues {
  firstName: string
  lastName: string
  email: string
  avatarUrl: string
}

interface Props {
  initialValues: InitialValues
  accessToken: string
}

export function ProfileForm({ initialValues, accessToken }: Props) {
  const router = useRouter()

  const [fields, setFields] = useState({
    firstName: initialValues.firstName,
    lastName: initialValues.lastName,
    avatarUrl: initialValues.avatarUrl,
  })
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  function setField(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }))
  }

  function setPassword(key: keyof typeof passwords) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setPasswords((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    setProfileLoading(true)

    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        accessToken,
        body: {
          firstName: fields.firstName,
          lastName: fields.lastName,
          ...(fields.avatarUrl ? { avatarUrl: fields.avatarUrl } : {}),
        },
      })
      setProfileSuccess(true)
      router.refresh()
    } catch (err) {
      setProfileError(
        err instanceof ApiError ? err.message : 'Failed to update profile. Please try again.'
      )
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordLoading(true)

    try {
      await apiFetch('/users/me/password', {
        method: 'PATCH',
        accessToken,
        body: {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
      })
      setPasswordSuccess(true)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(
        err instanceof ApiError ? err.message : 'Failed to change password. Please try again.'
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Profile info ────────────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Personal information</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5 px-6 py-5">
          {profileSuccess && (
            <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              Profile updated successfully.
            </div>
          )}
          {profileError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {profileError}
            </div>
          )}

          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              {fields.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fields.avatarUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">
                Avatar URL
              </label>
              <Input
                id="avatarUrl"
                type="url"
                value={fields.avatarUrl}
                onChange={setField('avatarUrl')}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <Input
                id="firstName"
                required
                value={fields.firstName}
                onChange={setField('firstName')}
                placeholder="John"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <Input
                id="lastName"
                required
                value={fields.lastName}
                onChange={setField('lastName')}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input value={initialValues.email} disabled className="cursor-not-allowed opacity-60" />
            <p className="text-xs text-gray-400">Email cannot be changed.</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </section>

      {/* ── Change password ─────────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Change password</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Leave blank if you signed in with Google or GitHub.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 px-6 py-5">
          {passwordSuccess && (
            <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              Password changed. All other sessions have been signed out.
            </div>
          )}
          {passwordError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Current password
            </label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={passwords.currentPassword}
              onChange={setPassword('currentPassword')}
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={passwords.newPassword}
                onChange={setPassword('newPassword')}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={passwords.confirmPassword}
                onChange={setPassword('confirmPassword')}
                placeholder="••••••••"
              />
              {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
