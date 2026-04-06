import type { Request, RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'
import { sendSuccess, sendCreated } from '@/utils/response'
import * as addressesService from './addresses.service'

function requireUser(req: Request) {
  if (!req.user?.id) throw AppError.unauthorized()
  return req.user
}

export const list: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const addresses = await addressesService.listAddresses(user.id)
    sendSuccess(res, addresses)
  } catch (err) {
    next(err)
  }
}

export const create: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const address = await addressesService.createAddress(user.id, req.body)
    sendCreated(res, address)
  } catch (err) {
    next(err)
  }
}

export const update: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    const address = await addressesService.updateAddress(String(req.params.id), user.id, req.body)
    sendSuccess(res, address)
  } catch (err) {
    next(err)
  }
}

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    await addressesService.deleteAddress(String(req.params.id), user.id)
    sendSuccess(res, null)
  } catch (err) {
    next(err)
  }
}

export const setDefault: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req)
    await addressesService.setDefault(String(req.params.id), user.id)
    sendSuccess(res, { message: 'Default address updated' })
  } catch (err) {
    next(err)
  }
}
