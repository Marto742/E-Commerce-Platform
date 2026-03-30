import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import type { CreateCategoryInput, UpdateCategoryInput } from '@repo/validation'

// Returns root categories only, with their immediate children nested.
// Use GET /categories?flat=true for a flat list of all categories.
export async function listCategories(flat = false) {
  if (flat) {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    })
  }

  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          children: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: { _count: { select: { products: true } } },
          },
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true } },
    },
  })
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { products: true } },
    },
  })
  if (!category) throw AppError.notFound('Category not found')
  return category
}

export async function createCategory(data: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({
    where: { slug: data.slug },
  })
  if (existing) throw AppError.conflict(`Slug "${data.slug}" is already taken`)

  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    })
    if (!parent) throw AppError.notFound('Parent category not found')
  }

  return prisma.category.create({ data })
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  await getCategoryById(id)

  if (data.slug) {
    const existing = await prisma.category.findFirst({
      where: { slug: data.slug, NOT: { id } },
    })
    if (existing) throw AppError.conflict(`Slug "${data.slug}" is already taken`)
  }

  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    })
    if (!parent) throw AppError.notFound('Parent category not found')
  }

  return prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!category) throw AppError.notFound('Category not found')
  if (category._count.products > 0)
    throw AppError.badRequest('Cannot delete a category that has products assigned to it')
  await prisma.category.delete({ where: { id } })
}
