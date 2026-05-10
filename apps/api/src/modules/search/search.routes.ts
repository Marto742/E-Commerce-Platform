import { Router } from 'express'
import { search } from './search.controller'

const router: Router = Router()

router.get('/', search)

export default router
