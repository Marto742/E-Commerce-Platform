import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { comparePassword, hashPassword } from '@/lib/password'
import { AppError } from '@/utils/AppError'
import { getProfile, updateProfile, changePassword, deleteAccount } from './users.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/password', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}))

const mockUser = {
  id: 'user-1',
  email: 'a@b.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUrl: null,
  phoneNumber: null,
  role: 'CUSTOMER',
  status: 'ACTIVE',
  emailVerifiedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getProfile', () => {
  it('returns the public user when found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    await expect(getProfile('user-1')).resolves.toEqual(mockUser)
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    )
  })

  it('throws notFound when the user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never)
    await expect(getProfile('missing')).rejects.toThrow(AppError)
    await expect(getProfile('missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('updateProfile', () => {
  it('updates only the provided fields', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as never)
    const result = await updateProfile('user-1', { firstName: 'New' })

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { firstName: 'New' },
      })
    )
    expect(result).toEqual(mockUser)
  })

  it('does not include undefined fields in the update payload', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as never)
    await updateProfile('user-1', {})
    const call = vi.mocked(prisma.user.update).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(call.data).toEqual({})
  })
})

describe('changePassword', () => {
  it('throws notFound when the user is missing', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never)
    await expect(
      changePassword('user-1', { currentPassword: 'old', newPassword: 'newPass1' })
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('rejects social-login (oauth) accounts', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'oauth:google' } as never)
    await expect(
      changePassword('user-1', { currentPassword: 'old', newPassword: 'newPass1' })
    ).rejects.toThrow(/social login/i)
  })

  it('throws when the current password is incorrect', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'hash' } as never)
    vi.mocked(comparePassword).mockResolvedValue(false)
    await expect(
      changePassword('user-1', { currentPassword: 'wrong', newPassword: 'newPass1' })
    ).rejects.toThrow(/incorrect/i)
  })

  it('hashes the new password and invalidates all sessions in a transaction', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'hash' } as never)
    vi.mocked(comparePassword).mockResolvedValue(true)
    vi.mocked(hashPassword).mockResolvedValue('new-hash')
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never)

    await changePassword('user-1', { currentPassword: 'old', newPassword: 'newPass1' })

    expect(hashPassword).toHaveBeenCalledWith('newPass1')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { passwordHash: 'new-hash' } })
    )
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

describe('deleteAccount', () => {
  it('throws notFound when the user is missing', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never)
    await expect(deleteAccount('user-1', 'pw')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws when the password is incorrect for a password account', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      passwordHash: 'hash',
      status: 'ACTIVE',
    } as never)
    vi.mocked(comparePassword).mockResolvedValue(false)
    await expect(deleteAccount('user-1', 'wrong')).rejects.toThrow(/incorrect/i)
  })

  it('soft-deletes and anonymises PII for a valid password account', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      passwordHash: 'hash',
      status: 'ACTIVE',
    } as never)
    vi.mocked(comparePassword).mockResolvedValue(true)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never)

    await deleteAccount('user-1', 'correct')

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ status: 'DELETED', firstName: 'Deleted' }),
      })
    )
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('skips the password check for oauth accounts', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      passwordHash: 'oauth:google',
      status: 'ACTIVE',
    } as never)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never)

    await deleteAccount('user-1', '')

    expect(comparePassword).not.toHaveBeenCalled()
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
