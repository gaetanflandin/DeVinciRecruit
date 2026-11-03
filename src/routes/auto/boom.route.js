/**
 * GET /boom → triggers an error to exercise the global error handler.
 */
import { Router } from 'express'

const router = Router()

router.get('/boomm', (_req, _res, next) => {
  const err = new Error('Booom!')
  err.status = 500
  next(err)
})

export default router
