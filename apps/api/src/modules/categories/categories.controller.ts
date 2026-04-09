import type { RequestHandler } from 'express'
import { sendSuccess, sendCreated } from '@/utils/response'
import { logActivity } from '@/modules/admin/activity-log.service'
import * as categoriesService from './categories.service'

export const list: RequestHandler = async (req, res, next) => {
  try {
    const flat = req.query['flat'] === 'true'
    const categories = await categoriesService.listCategories(flat)
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
    if (req.user?.id)
      logActivity(req.user.id, 'category.create', 'category', category.id, { name: category.name })
    sendCreated(res, category)
  } catch (err) {
    next(err)
  }
}

export const update: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategory(req.params['id'] as string, req.body)
    if (req.user?.id)
      logActivity(req.user.id, 'category.update', 'category', category.id, { name: category.name })
    sendSuccess(res, category)
  } catch (err) {
    next(err)
  }
}

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params['id'] as string
    await categoriesService.deleteCategory(id)
    if (req.user?.id) logActivity(req.user.id, 'category.delete', 'category', id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
