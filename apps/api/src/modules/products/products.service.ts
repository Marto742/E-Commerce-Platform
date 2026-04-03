import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import { buildPaginationMeta } from '@/utils/response'
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  ProductQueryInput,
} from '@repo/validation'

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: {
    where: { isActive: true },
    orderBy: { name: 'asc' as const },
  },
  _count: { select: { reviews: true } },
} as const

export async function listProducts(query: ProductQueryInput) {
  const {
    page,
    limit,
    search,
    categoryId,
    isFeatured,
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query
  const skip = (page - 1) * limit

  const where = {
    isActive: true,
    ...(categoryId && { categoryId }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...((minPrice || maxPrice) && {
      basePrice: {
        ...(minPrice && { gte: minPrice }),
        ...(maxPrice && { lte: maxPrice }),
      },
    }),
    // Filter to products that have at least one review meeting the minimum
    // rating, then the avgRating check below refines to true averages.
    ...(minRating && {
      reviews: { some: { rating: { gte: minRating } } },
    }),
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        _count: { select: { variants: true, reviews: true } },
      },
    }),
    prisma.product.count({ where }),
  ])

  // Attach average rating to each product via a single groupBy query
  const productIds = products.map((p) => p.id)
  const avgRatings =
    productIds.length > 0
      ? await prisma.review.groupBy({
          by: ['productId'],
          where: { productId: { in: productIds } },
          _avg: { rating: true },
        })
      : []

  const avgRatingMap = new Map(avgRatings.map((r) => [r.productId, r._avg.rating]))

  const productsWithRating = products.map((p) => ({
    ...p,
    avgRating: avgRatingMap.get(p.id) ?? null,
  }))

  // If minRating is set, post-filter to true average (the `some` filter above
  // is a pre-filter; this ensures the average itself meets the threshold)
  const filtered =
    minRating != null
      ? productsWithRating.filter((p) => p.avgRating != null && p.avgRating >= minRating)
      : productsWithRating

  return { products: filtered, meta: buildPaginationMeta(total, page, limit) }
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  })
  if (!product) throw AppError.notFound('Product not found')
  return product
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: PRODUCT_INCLUDE,
  })
  if (!product) throw AppError.notFound('Product not found')
  return product
}

export async function createProduct(data: CreateProductInput) {
  const existingSlug = await prisma.product.findUnique({
    where: { slug: data.slug },
  })
  if (existingSlug) throw AppError.conflict(`Slug "${data.slug}" is already taken`)

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  })
  if (!category) throw AppError.notFound('Category not found')

  return prisma.product.create({ data, include: PRODUCT_INCLUDE })
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  await getProductById(id)

  if (data.slug) {
    const existingSlug = await prisma.product.findFirst({
      where: { slug: data.slug, NOT: { id } },
    })
    if (existingSlug) throw AppError.conflict(`Slug "${data.slug}" is already taken`)
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    })
    if (!category) throw AppError.notFound('Category not found')
  }

  return prisma.product.update({ where: { id }, data, include: PRODUCT_INCLUDE })
}

export async function deleteProduct(id: string) {
  await getProductById(id)
  await prisma.product.delete({ where: { id } })
}

export async function listVariants(productId: string) {
  await getProductById(productId)
  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: { name: 'asc' },
  })
}

export async function getVariantById(productId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  })
  if (!variant) throw AppError.notFound('Variant not found')
  return variant
}

export type StockOperation = 'set' | 'add' | 'subtract'

export async function adjustStock(
  productId: string,
  variantId: string,
  operation: StockOperation,
  quantity: number
) {
  const variant = await getVariantById(productId, variantId)

  let newStock: number
  if (operation === 'set') {
    newStock = quantity
  } else if (operation === 'add') {
    newStock = variant.stock + quantity
  } else {
    newStock = variant.stock - quantity
    if (newStock < 0)
      throw AppError.badRequest(
        `Cannot subtract ${quantity} from current stock of ${variant.stock}`
      )
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: newStock },
  })
}

export async function createVariant(
  productId: string,
  data: Omit<CreateVariantInput, 'productId'>
) {
  await getProductById(productId)

  const existingSku = await prisma.productVariant.findUnique({
    where: { sku: data.sku },
  })
  if (existingSku) throw AppError.conflict(`SKU "${data.sku}" is already in use`)

  const { sku, name, price, stock = 0, attributes = {}, isActive = true } = data
  return prisma.productVariant.create({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data: {
      productId,
      sku,
      name,
      price,
      stock,
      attributes: JSON.parse(JSON.stringify(attributes)),
      isActive,
    },
  })
}

export async function updateVariant(
  productId: string,
  variantId: string,
  data: UpdateVariantInput
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  })
  if (!variant) throw AppError.notFound('Variant not found')

  if (data.sku) {
    const existingSku = await prisma.productVariant.findFirst({
      where: { sku: data.sku, NOT: { id: variantId } },
    })
    if (existingSku) throw AppError.conflict(`SKU "${data.sku}" is already in use`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { productId: _pid, attributes, ...rest } = data
  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...rest,
      ...(attributes !== undefined && {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        attributes: JSON.parse(JSON.stringify(attributes)),
      }),
    },
  })
}

export async function deleteVariant(productId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  })
  if (!variant) throw AppError.notFound('Variant not found')
  await prisma.productVariant.delete({ where: { id: variantId } })
}
