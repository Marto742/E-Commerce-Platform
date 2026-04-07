import type { Request, RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendSuccess } from '@/utils/response'
import * as usersService from './users.service'

function requireUser(req: Request) {
  if (!req.user?.id) throw AppError.unauthorized()
  return req.user
}

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const profile = await usersService.getProfile(user.id)
    sendSuccess(res, profile)
  } catch (err) {
    next(err)
  }
}

export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const updated = await usersService.updateProfile(user.id, req.body)
    sendSuccess(res, updated)
  } catch (err) {
    next(err)
  }
}

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    await usersService.changePassword(user.id, req.body)
    sendSuccess(res, { message: 'Password changed successfully' })
  } catch (err) {
    next(err)
  }
}

export const deleteMe: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const { password } = req.body as { password?: string }
    if (!password) throw AppError.badRequest('Password is required to delete your account')
    await usersService.deleteAccount(user.id, password)
    sendSuccess(res, { message: 'Account deleted' })
  } catch (err) {
    next(err)
  }
}
