import type { RequestHandler } from 'express'
import { sendSuccess, sendCreated } from '@/utils/response'
import * as authService from './auth.service'

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.register(req.body)
    sendCreated(res, user)
  } catch (err) {
    next(err)
  }
}

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    const result = await authService.login(email, password)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export const refreshToken: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.body as { token: string }
    const result = await authService.refresh(token)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.body as { token?: string }
    if (token) await authService.logout(token)
    sendSuccess(res, null)
  } catch (err) {
    next(err)
  }
}
