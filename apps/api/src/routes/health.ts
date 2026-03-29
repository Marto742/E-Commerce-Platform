import { Router } from 'express'
import { sendSuccess } from '@/utils/response'

const router = Router()

router.get('/', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV ?? 'development',
  })
})

export default router
