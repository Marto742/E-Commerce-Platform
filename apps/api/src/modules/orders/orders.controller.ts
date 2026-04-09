import type { Request, RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendSuccess, sendCreated, sendPaginated } from '@/utils/response'
import { logActivity } from '@/modules/admin/activity-log.service'
import * as ordersService from './orders.service'

function requireUser(req: Request) {
  if (!req.user?.id) throw AppError.unauthorized()
  return req.user
}

function isAdmin(req: Request) {
  return req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN'
}

export const list: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const { orders, meta } = await ordersService.listOrders(
      user.id,
      isAdmin(req),
      req.query as never
    )
    sendPaginated(res, orders, meta)
  } catch (err) {
    next(err)
  }
}

export const getOne: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const order = await ordersService.getOrderById(
      req.params['id'] as string,
      user.id,
      isAdmin(req)
    )
    sendSuccess(res, order)
  } catch (err) {
    next(err)
  }
}

export const create: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const order = await ordersService.createOrder(user.id, req.body)
    sendCreated(res, order)
  } catch (err) {
    next(err)
  }
}

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    if (!isAdmin(req)) throw AppError.forbidden()
    const order = await ordersService.updateOrderStatus(
      req.params['id'] as string,
      req.body.status as string
    )
    logActivity(user.id, 'order.status_update', 'order', order.id, { status: order.status })
    sendSuccess(res, order)
  } catch (err) {
    next(err)
  }
}

export const cancel: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const order = await ordersService.cancelOrder(req.params['id'] as string, user.id)
    sendSuccess(res, order)
  } catch (err) {
    next(err)
  }
}

export const refund: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    if (!isAdmin(req)) throw AppError.forbidden()
    const order = await ordersService.refundOrder(
      req.params['id'] as string,
      req.body.reason as string | undefined
    )
    logActivity(user.id, 'order.refund', 'order', order.id, { reason: req.body.reason })
    sendSuccess(res, order)
  } catch (err) {
    next(err)
  }
}

export const updateTracking: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    if (!isAdmin(req)) throw AppError.forbidden()
    const order = await ordersService.setTrackingNumber(
      req.params['id'] as string,
      req.body.trackingNumber as string
    )
    logActivity(user.id, 'order.tracking_update', 'order', order.id, {
      trackingNumber: req.body.trackingNumber,
    })
    sendSuccess(res, order)
  } catch (err) {
    next(err)
  }
}
