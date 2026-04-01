import type { Request, RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendSuccess, sendCreated } from '@/utils/response'
import * as wishlistService from './wishlist.service'

function requireUser(req: Request) {
  if (!req.user?.id) throw AppError.unauthorized()
  return req.user
}

// All wishlist endpoints require authentication (auth guard wired in Phase 3).

export const getWishlist: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const wishlist = await wishlistService.getWishlist(user.id)
    sendSuccess(res, wishlist)
  } catch (err) {
    next(err)
  }
}

export const addItem: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const item = await wishlistService.addItem(user.id, req.body)
    sendCreated(res, item)
  } catch (err) {
    next(err)
  }
}

export const removeItem: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    await wishlistService.removeItem(user.id, req.params['productId'] as string)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const clearWishlist: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    await wishlistService.clearWishlist(user.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const checkItem: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const wishlisted = await wishlistService.isWishlisted(
      user.id,
      req.params['productId'] as string
    )
    sendSuccess(res, { wishlisted })
  } catch (err) {
    next(err)
  }
}
