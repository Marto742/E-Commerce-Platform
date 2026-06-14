import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefault,
} from './addresses.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    address: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const baseAddress = {
  line1: '1 Analytical Way',
  city: 'London',
  state: 'LDN',
  postalCode: 'EC1',
  country: 'GB',
}

beforeEach(() => {
  vi.clearAllMocks()
  // Support both the callback form ($transaction(async (tx) => ...)) and the
  // array form ($transaction([...])) — the tx client reuses the mocked prisma.
  vi.mocked(prisma.$transaction).mockImplementation(((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: typeof prisma) => unknown)(prisma)
      : Promise.all(arg as unknown[])) as never)
})

describe('listAddresses', () => {
  it('returns addresses ordered by default then creation', async () => {
    const rows = [{ id: 'a1' }, { id: 'a2' }]
    vi.mocked(prisma.address.findMany).mockResolvedValue(rows as never)
    await expect(listAddresses('user-1')).resolves.toEqual(rows)
    expect(prisma.address.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })
})

describe('createAddress', () => {
  it('unsets existing defaults when the new address is default', async () => {
    vi.mocked(prisma.address.count).mockResolvedValue(2 as never)
    vi.mocked(prisma.address.create).mockResolvedValue({ id: 'a1' } as never)

    await createAddress('user-1', { ...baseAddress, isDefault: true })

    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { isDefault: false },
    })
    expect(prisma.address.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) })
    )
  })

  it('forces the first address to be default', async () => {
    vi.mocked(prisma.address.count).mockResolvedValue(0 as never)
    vi.mocked(prisma.address.create).mockResolvedValue({ id: 'a1' } as never)

    // caller omits isDefault -> service applies the "first address is default" rule
    await createAddress('user-1', baseAddress as never)

    expect(prisma.address.updateMany).not.toHaveBeenCalled()
    expect(prisma.address.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) })
    )
  })
})

describe('updateAddress', () => {
  it('throws notFound when the address is missing', async () => {
    vi.mocked(prisma.address.findUnique).mockResolvedValue(null as never)
    await expect(updateAddress('a1', 'user-1', {})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws forbidden when the address belongs to another user', async () => {
    vi.mocked(prisma.address.findUnique).mockResolvedValue({
      id: 'a1',
      userId: 'someone-else',
    } as never)
    await expect(updateAddress('a1', 'user-1', {})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('updates the address (and clears other defaults when set default)', async () => {
    vi.mocked(prisma.address.findUnique).mockResolvedValue({ id: 'a1', userId: 'user-1' } as never)
    vi.mocked(prisma.address.update).mockResolvedValue({ id: 'a1' } as never)

    await updateAddress('a1', 'user-1', { isDefault: true })

    expect(prisma.address.updateMany).toHaveBeenCalled()
    expect(prisma.address.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' } })
    )
  })
})

describe('deleteAddress', () => {
  it('throws forbidden for another user', async () => {
    vi.mocked(prisma.address.findUnique).mockResolvedValue({ id: 'a1', userId: 'other' } as never)
    await expect(deleteAddress('a1', 'user-1')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('deletes a non-default address without promoting another', async () => {
    vi.mocked(prisma.address.findUnique).mockResolvedValue({
      id: 'a1',
      userId: 'user-1',
      isDefault: false,
    } as never)

    await deleteAddress('a1', 'user-1')

    expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: 'a1' } })
    expect(prisma.address.findFirst).not.toHaveBeenCalled()
  })

  it('promotes the oldest remaining address when the default is deleted', async () => {
    vi.mocked(prisma.address.findUnique).mockResolvedValue({
      id: 'a1',
      userId: 'user-1',
      isDefault: true,
    } as never)
    vi.mocked(prisma.address.findFirst).mockResolvedValue({ id: 'a2' } as never)

    await deleteAddress('a1', 'user-1')

    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: 'a2' },
      data: { isDefault: true },
    })
  })
})

describe('setDefault', () => {
  it('throws notFound when missing', async () => {
    vi.mocked(prisma.address.findUnique).mockResolvedValue(null as never)
    await expect(setDefault('a1', 'user-1')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('clears existing defaults and sets the new one', async () => {
    vi.mocked(prisma.address.findUnique).mockResolvedValue({ id: 'a1', userId: 'user-1' } as never)

    await setDefault('a1', 'user-1')

    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { isDefault: false },
    })
    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { isDefault: true },
    })
  })
})
