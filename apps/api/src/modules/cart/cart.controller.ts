import type { Request, RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendSuccess } from '@/utils/response'
import * as cartService from './cart.service'
import type { CartIdentifier } from './cart.service'

/**
 * Resolves the cart owner from either:
 *  - req.user (set by auth middleware in Phase 3)
 *  - X-Session-ID header (guest / pre-auth)
 */
function resolveIdentifier(req: Request): CartIdentifier {
  if (req.user?.id) return { userId: req.user.id }

  const sessionId = req.headers['x-session-id']
  if (typeof sessionId === 'string' && sessionId.trim()) {
    return { sessionId: sessionId.trim() }
  }

  throw AppError.badRequest('Provide an X-Session-ID header or authenticate to access the cart')
}

export const getCart: RequestHandler = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(resolveIdentifier(req))
    sendSuccess(res, cart)
  } catch (err) {
    next(err)
  }
}

export const addItem: RequestHandler = async (req, res, next) => {
  try {
    const { variantId, quantity } = req.body as {
      variantId: string
      quantity: number
    }
    const cart = await cartService.addItem(resolveIdentifier(req), variantId, quantity)
    sendSuccess(res, cart, 201)
  } catch (err) {
    next(err)
  }
}

export const updateItem: RequestHandler = async (req, res, next) => {
  try {
    const itemId = req.params['itemId'] as string
    const { quantity } = req.body as { quantity: number }
    const cart = await cartService.updateItem(resolveIdentifier(req), itemId, quantity)
    sendSuccess(res, cart)
  } catch (err) {
    next(err)
  }
}

export const removeItem: RequestHandler = async (req, res, next) => {
  try {
    const itemId = req.params['itemId'] as string
    const cart = await cartService.removeItem(resolveIdentifier(req), itemId)
    sendSuccess(res, cart)
  } catch (err) {
    next(err)
  }
}

export const clearCart: RequestHandler = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(resolveIdentifier(req))
    sendSuccess(res, cart)
  } catch (err) {
    next(err)
  }
}
