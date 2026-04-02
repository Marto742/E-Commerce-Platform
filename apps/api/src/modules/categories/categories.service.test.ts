import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.service'
import { AppError } from '@/utils/AppError'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const mockCategory = {
  id: 'cat-1',
  name: 'Electronics',
  slug: 'electronics',
  parentId: null,
  isActive: true,
  sortOrder: 0,
  _count: { products: 3 },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── listCategories ───────────────────────────────────────────────────────────

describe('listCategories', () => {
  it('returns nested tree by default', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([mockCategory] as never)
    const result = await listCategories()
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true, parentId: null } })
    )
    expect(result).toEqual([mockCategory])
  })

  it('returns flat list when flat=true', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([mockCategory] as never)
    const result = await listCategories(true)
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    )
    expect(result).toEqual([mockCategory])
  })
})

// ─── getCategoryById ──────────────────────────────────────────────────────────

describe('getCategoryById', () => {
  it('returns category when found', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
    const result = await getCategoryById('cat-1')
    expect(result).toEqual(mockCategory)
  })

  it('throws notFound when category does not exist', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    await expect(getCategoryById('missing')).rejects.toThrow(AppError)
    await expect(getCategoryById('missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
    })
  })
})

// ─── createCategory ───────────────────────────────────────────────────────────

describe('createCategory', () => {
  const input = { name: 'Laptops', slug: 'laptops' }

  it('creates and returns a new category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.category.create).mockResolvedValue({ ...mockCategory, ...input } as never)
    const result = await createCategory(input)
    expect(prisma.category.create).toHaveBeenCalledWith({ data: input })
    expect(result).toMatchObject(input)
  })

  it('throws conflict when slug is taken', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
    await expect(createCategory(input)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    })
    expect(prisma.category.create).not.toHaveBeenCalled()
  })

  it('throws notFound when parentId does not exist', async () => {
    const inputWithParent = { ...input, parentId: 'missing-parent' }
    // First call: slug check → null; second call: parent check → null
    vi.mocked(prisma.category.findUnique).mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    await expect(createCategory(inputWithParent)).rejects.toMatchObject({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
    })
  })
})

// ─── updateCategory ───────────────────────────────────────────────────────────

describe('updateCategory', () => {
  it('updates and returns the category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
    vi.mocked(prisma.category.update).mockResolvedValue({
      ...mockCategory,
      name: 'Updated',
    } as never)
    const result = await updateCategory('cat-1', { name: 'Updated' })
    expect(prisma.category.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cat-1' } })
    )
    expect(result).toMatchObject({ name: 'Updated' })
  })

  it('throws notFound when category does not exist', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    await expect(updateCategory('missing', { name: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws conflict when new slug is already taken by another category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never)
    vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'other' } as never)
    await expect(updateCategory('cat-1', { slug: 'taken-slug' })).rejects.toMatchObject({
      statusCode: 409,
    })
  })
})

// ─── deleteCategory ───────────────────────────────────────────────────────────

describe('deleteCategory', () => {
  it('deletes category with no products', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      _count: { products: 0 },
    } as never)
    await deleteCategory('cat-1')
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } })
  })

  it('throws notFound when category does not exist', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    await expect(deleteCategory('missing')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws badRequest when category has products assigned', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      _count: { products: 2 },
    } as never)
    await expect(deleteCategory('cat-1')).rejects.toMatchObject({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
    })
    expect(prisma.category.delete).not.toHaveBeenCalled()
  })
})
