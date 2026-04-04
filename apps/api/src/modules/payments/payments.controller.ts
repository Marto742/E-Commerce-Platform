import type { RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendSuccess, sendCreated } from '@/utils/response'
import * as paymentsService from './payments.service'
import * as webhookService from './webhook.service'

export const createIntent: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user?.id) throw AppError.unauthorized()
    const result = await paymentsService.createPaymentIntent(req.user.id, req.body)
    sendCreated(res, result)
  } catch (err) {
    next(err)
  }
}

export const createGuestIntent: RequestHandler = async (req, res, next) => {
  try {
    const result = await paymentsService.createGuestPaymentIntent(req.body)
    sendCreated(res, result)
  } catch (err) {
    next(err)
  }
}

export const getStatus: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user?.id) throw AppError.unauthorized()
    const result = await paymentsService.getPaymentStatus(
      req.params.orderId as string,
      req.user.id,
      req.user.role === 'ADMIN'
    )
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export const webhook: RequestHandler = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature']
    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: 'Missing stripe-signature header' })
      return
    }

    await webhookService.handleWebhookEvent(req.body as Buffer, signature)
    sendSuccess(res, { received: true })
  } catch (err) {
    // 400 for signature failures (don't retry), 500 for unexpected errors (Stripe will retry)
    const message = err instanceof Error ? err.message : 'Webhook error'
    const status = message.includes('signature') ? 400 : 500
    res.status(status).json({ error: message })
    next(err)
  }
}
