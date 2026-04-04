import type { RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendSuccess, sendCreated, sendPaginated } from '@/utils/response'
import * as couponsService from './coupons.service'

function requireAdmin(req: Parameters<RequestHandler>[0]) {
  if (!req.user?.id) throw AppError.unauthorized()
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') throw AppError.forbidden()
}

export const list: RequestHandler = async (req, res, next) => {
  try {
    requireAdmin(req)
    const { page = 1, limit = 20, isActive, search } = req.query as Record<string, string>
    const { coupons, meta } = await couponsService.listCoupons({
      page: Number(page),
      limit: Number(limit),
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search: search as string | undefined,
    })
    sendPaginated(res, coupons, meta)
  } catch (err) {
    next(err)
  }
}

export const getOne: RequestHandler = async (req, res, next) => {
  try {
    requireAdmin(req)
    const coupon = await couponsService.getCouponById(req.params['id'] as string)
    sendSuccess(res, coupon)
  } catch (err) {
    next(err)
  }
}

export const create: RequestHandler = async (req, res, next) => {
  try {
    requireAdmin(req)
    const coupon = await couponsService.createCoupon(req.body)
    sendCreated(res, coupon)
  } catch (err) {
    next(err)
  }
}

export const update: RequestHandler = async (req, res, next) => {
  try {
    requireAdmin(req)
    const coupon = await couponsService.updateCoupon(req.params['id'] as string, req.body)
    sendSuccess(res, coupon)
  } catch (err) {
    next(err)
  }
}

export const remove: RequestHandler = async (req, res, next) => {
  try {
    requireAdmin(req)
    await couponsService.deleteCoupon(req.params['id'] as string)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export const validate: RequestHandler = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body as { code: string; subtotal: number }
    const result = await couponsService.validateCoupon(code, subtotal)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
