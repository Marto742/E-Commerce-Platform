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

export const verifyEmail: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.body as { token: string }
    await authService.verifyEmail(token)
    sendSuccess(res, { message: 'Email verified successfully' })
  } catch (err) {
    next(err)
  }
}

export const resendVerification: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body as { email: string }
    await authService.resendVerification(email)
    // Always 200 to avoid email enumeration
    sendSuccess(res, {
      message: 'If that email exists and is unverified, a new link has been sent',
    })
  } catch (err) {
    next(err)
  }
}

export const oauthLogin: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.oauthLogin(req.body)
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

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body as { email: string }
    await authService.forgotPassword(email)
    // Always 200 to avoid email enumeration
    sendSuccess(res, { message: 'If that email is registered, a reset link has been sent' })
  } catch (err) {
    next(err)
  }
}

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { token, password } = req.body as { token: string; password: string }
    await authService.resetPassword(token, password)
    sendSuccess(res, { message: 'Password reset successfully' })
  } catch (err) {
    next(err)
  }
}
