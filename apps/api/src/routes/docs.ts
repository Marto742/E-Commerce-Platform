import { Router, type Request, type Response } from 'express'
import swaggerUi from 'swagger-ui-express'
import spec from '@/docs/openapi'

const docsRouter: Router = Router()

// GET /v1/docs.json — raw OpenAPI spec
docsRouter.get('/docs.json', (_req: Request, res: Response) => {
  res.json(spec)
})

// GET /v1/docs — Swagger UI
docsRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: false }))

export default docsRouter
