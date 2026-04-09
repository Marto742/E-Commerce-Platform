import type { RequestHandler } from 'express'
import { sendSuccess, sendCreated, sendPaginated } from '@/utils/response'
import { logActivity } from '@/modules/admin/activity-log.service'
import * as productsService from './products.service'

export const list: RequestHandler = async (req, res, next) => {
  try {
    const { products, meta } = await productsService.listProducts(req.query as never)
    sendPaginated(res, products, meta)
  } catch (err) {
    next(err)
  }
}

export const getOne: RequestHandler = async (req, res, next) => {
  try {
    const product = await productsService.getProductById(req.params['id'] as string)
    sendSuccess(res, product)
  } catch (err) {
    next(err)
  }
}

export const getBySlug: RequestHandler = async (req, res, next) => {
  try {
    const product = await productsService.getProductBySlug(req.params['slug'] as string)
    sendSuccess(res, product)
  } catch (err) {
    next(err)
  }
}

export const create: RequestHandler = async (req, res, next) => {
  try {
    const product = await productsService.createProduct(req.body)
    if (req.user?.id)
      logActivity(req.user.id, 'product.create', 'product', product.id, { name: product.name })
    sendCreated(res, product)
  } catch (err) {
    next(err)
  }
}

export const update: RequestHandler = async (req, res, next) => {
  try {
    const product = await productsService.updateProduct(req.params['id'] as string, req.body)
    if (req.user?.id)
      logActivity(req.user.id, 'product.update', 'product', product.id, { name: product.name })
    sendSuccess(res, product)
  } catch (err) {
    next(err)
  }
}

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params['id'] as string
    await productsService.deleteProduct(id)
    if (req.user?.id) logActivity(req.user.id, 'product.delete', 'product', id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const listVariants: RequestHandler = async (req, res, next) => {
  try {
    const variants = await productsService.listVariants(req.params['id'] as string)
    sendSuccess(res, variants)
  } catch (err) {
    next(err)
  }
}

export const createVariant: RequestHandler = async (req, res, next) => {
  try {
    const variant = await productsService.createVariant(req.params['id'] as string, req.body)
    sendCreated(res, variant)
  } catch (err) {
    next(err)
  }
}

export const updateVariant: RequestHandler = async (req, res, next) => {
  try {
    const variant = await productsService.updateVariant(
      req.params['id'] as string,
      req.params['variantId'] as string,
      req.body
    )
    sendSuccess(res, variant)
  } catch (err) {
    next(err)
  }
}

export const removeVariant: RequestHandler = async (req, res, next) => {
  try {
    await productsService.deleteVariant(
      req.params['id'] as string,
      req.params['variantId'] as string
    )
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const getVariant: RequestHandler = async (req, res, next) => {
  try {
    const variant = await productsService.getVariantById(
      req.params['id'] as string,
      req.params['variantId'] as string
    )
    sendSuccess(res, variant)
  } catch (err) {
    next(err)
  }
}

export const adjustStock: RequestHandler = async (req, res, next) => {
  try {
    const variant = await productsService.adjustStock(
      req.params['id'] as string,
      req.params['variantId'] as string,
      req.body.operation,
      req.body.quantity
    )
    if (req.user?.id)
      logActivity(req.user.id, 'product.stock_adjust', 'product', req.params['id'] as string, {
        variantId: variant.id,
        operation: req.body.operation,
        quantity: req.body.quantity,
      })
    sendSuccess(res, variant)
  } catch (err) {
    next(err)
  }
}

export const addImage: RequestHandler = async (req, res, next) => {
  try {
    const image = await productsService.addProductImage(
      req.params['id'] as string,
      req.body.url as string,
      req.body.altText as string | undefined
    )
    sendCreated(res, image)
  } catch (err) {
    next(err)
  }
}

export const removeImage: RequestHandler = async (req, res, next) => {
  try {
    await productsService.deleteProductImage(
      req.params['id'] as string,
      req.params['imageId'] as string
    )
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const reorderImages: RequestHandler = async (req, res, next) => {
  try {
    await productsService.reorderProductImages(
      req.params['id'] as string,
      req.body.orderedIds as string[]
    )
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
