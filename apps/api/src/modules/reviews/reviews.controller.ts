import type { Request, RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendSuccess, sendCreated, sendPaginated } from '@/utils/response'
import * as reviewsService from './reviews.service'
import type { ReviewQueryInput } from '@repo/validation'

function requireUser(req: Request) {
  if (!req.user?.id) throw AppError.unauthorized()
  return req.user
}

function isAdmin(req: Request) {
  return req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN'
}

// ─── Product-scoped (mounted under /products/:id/reviews) ─────────────────────

export const listForProduct: RequestHandler = async (req, res, next) => {
  try {
    const { reviews, meta } = await reviewsService.listProductReviews(
      req.params['id'] as string,
      req.query as unknown as ReviewQueryInput
    )
    sendPaginated(res, reviews, meta)
  } catch (err) {
    next(err)
  }
}

export const productSummary: RequestHandler = async (req, res, next) => {
  try {
    const summary = await reviewsService.getProductRatingSummary(req.params['id'] as string)
    sendSuccess(res, summary)
  } catch (err) {
    next(err)
  }
}

// ─── Standalone (/reviews) ────────────────────────────────────────────────────

export const getOne: RequestHandler = async (req, res, next) => {
  try {
    const review = await reviewsService.getReviewById(req.params['id'] as string)
    sendSuccess(res, review)
  } catch (err) {
    next(err)
  }
}

export const listMine: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const { reviews, meta } = await reviewsService.listMyReviews(
      user.id,
      req.query as unknown as ReviewQueryInput
    )
    sendPaginated(res, reviews, meta)
  } catch (err) {
    next(err)
  }
}

export const create: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const review = await reviewsService.createReview(user.id, req.body)
    sendCreated(res, review)
  } catch (err) {
    next(err)
  }
}

export const update: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const review = await reviewsService.updateReview(user.id, req.params['id'] as string, req.body)
    sendSuccess(res, review)
  } catch (err) {
    next(err)
  }
}

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    await reviewsService.deleteReview(user.id, req.params['id'] as string, isAdmin(req))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
