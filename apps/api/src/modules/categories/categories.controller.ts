import type { RequestHandler } from 'express'
import { sendSuccess, sendCreated } from '@/utils/response'
import * as categoriesService from './categories.service'

export const list: RequestHandler = async (_req, res, next) => {
  try {
    const categories = await categoriesService.listCategories()
    sendSuccess(res, categories)
  } catch (err) {
    next(err)
  }
}

export const getOne: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoriesService.getCategoryById(req.params['id'] as string)
    sendSuccess(res, category)
  } catch (err) {
    next(err)
  }
}

export const create: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoriesService.createCategory(req.body)
    sendCreated(res, category)
  } catch (err) {
    next(err)
  }
}

export const update: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategory(req.params['id'] as string, req.body)
    sendSuccess(res, category)
  } catch (err) {
    next(err)
  }
}

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await categoriesService.deleteCategory(req.params['id'] as string)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
