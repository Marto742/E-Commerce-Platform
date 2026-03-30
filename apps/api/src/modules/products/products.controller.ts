import type { RequestHandler } from 'express'
import { sendSuccess, sendCreated, sendPaginated } from '@/utils/response'
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
    sendCreated(res, product)
  } catch (err) {
    next(err)
  }
}

export const update: RequestHandler = async (req, res, next) => {
  try {
    const product = await productsService.updateProduct(req.params['id'] as string, req.body)
    sendSuccess(res, product)
  } catch (err) {
    next(err)
  }
}

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await productsService.deleteProduct(req.params['id'] as string)
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
