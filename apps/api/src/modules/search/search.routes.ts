import { Router } from 'express'
import { optionalAuthenticate } from '@/middleware/authenticate'
import { searchLimiter } from '@/middleware/rateLimiter'
import { search, trackSearch } from './search.controller'

const router: Router = Router()

router.get('/', search)
router.post('/events', searchLimiter, optionalAuthenticate, trackSearch)

export default router
