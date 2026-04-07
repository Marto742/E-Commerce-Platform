import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import { comparePassword, hashPassword } from '@/lib/password'
import type { UpdateProfileInput, ChangePasswordInput } from '@repo/validation'

const PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  phoneNumber: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_SELECT })
  if (!user) throw AppError.notFound('User not found')
  return user
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
    },
    select: PUBLIC_SELECT,
  })
  return user
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  })
  if (!user) throw AppError.notFound('User not found')

  // OAuth-only accounts have a placeholder hash; block direct password change
  if (user.passwordHash.startsWith('oauth:')) {
    throw AppError.badRequest('Password cannot be changed for social login accounts')
  }

  const valid = await comparePassword(data.currentPassword, user.passwordHash)
  if (!valid) throw AppError.badRequest('Current password is incorrect')

  const passwordHash = await hashPassword(data.newPassword)

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    // Invalidate all refresh tokens so existing sessions sign out
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ])
}

export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, status: true },
  })
  if (!user) throw AppError.notFound('User not found')

  // For OAuth-only accounts skip password check
  if (!user.passwordHash.startsWith('oauth:')) {
    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) throw AppError.badRequest('Password is incorrect')
  }

  await prisma.$transaction([
    // Soft-delete: mark as DELETED and anonymise PII
    prisma.user.update({
      where: { id: userId },
      data: {
        status: 'DELETED',
        email: `deleted_${userId}@deleted.invalid`,
        passwordHash: 'deleted',
        firstName: 'Deleted',
        lastName: 'User',
        avatarUrl: null,
        phoneNumber: null,
      },
    }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ])
}
