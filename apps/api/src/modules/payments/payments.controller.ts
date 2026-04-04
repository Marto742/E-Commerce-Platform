import type { RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendCreated } from '@/utils/response'
import * as paymentsService from './payments.service'

export const createIntent: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user?.id) throw AppError.unauthorized()
    const result = await paymentsService.createPaymentIntent(req.user.id, req.body)
    sendCreated(res, result)
  } catch (err) {
    next(err)
  }
}
