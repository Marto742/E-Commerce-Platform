import { Router } from 'express'
import healthRouter from './health'

const router = Router()

// ── System ────────────────────────────────────────────────
router.use('/health', healthRouter)

// ── Auth ──────────────────────────────────────────────────
// router.use('/auth', authRouter)          // Phase 3

// ── Users ─────────────────────────────────────────────────
// router.use('/users', usersRouter)        // Phase 3

// ── Products & Catalog ────────────────────────────────────
// router.use('/products', productsRouter)  // Phase 4
// router.use('/categories', categoriesRouter) // Phase 4

// ── Cart & Checkout ───────────────────────────────────────
// router.use('/cart', cartRouter)          // Phase 5
// router.use('/checkout', checkoutRouter)  // Phase 5

// ── Orders ────────────────────────────────────────────────
// router.use('/orders', ordersRouter)      // Phase 6

// ── Payments ──────────────────────────────────────────────
// router.use('/payments', paymentsRouter)  // Phase 5

// ── Uploads ───────────────────────────────────────────────
// router.use('/uploads', uploadsRouter)    // Phase 9

// ── Admin ─────────────────────────────────────────────────
// router.use('/admin', adminRouter)        // Phase 6

export default router
