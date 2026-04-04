import { Router } from 'express'
import healthRouter from './health'
import docsRouter from './docs'
import productsRouter from '@/modules/products/products.routes'
import categoriesRouter from '@/modules/categories/categories.routes'
import cartRouter from '@/modules/cart/cart.routes'
import ordersRouter from '@/modules/orders/orders.routes'
import inventoryRouter from '@/modules/inventory/inventory.routes'
import reviewsRouter from '@/modules/reviews/reviews.routes'
import wishlistRouter from '@/modules/wishlist/wishlist.routes'
import paymentsRouter from '@/modules/payments/payments.routes'

const router: Router = Router()

// ── System ────────────────────────────────────────────────
router.use('/health', healthRouter)

// ── API Docs ──────────────────────────────────────────────
router.use('/', docsRouter)

// ── Auth ──────────────────────────────────────────────────
// router.use('/auth', authRouter)          // Phase 3

// ── Users ─────────────────────────────────────────────────
// router.use('/users', usersRouter)        // Phase 3

// ── Products & Catalog ────────────────────────────────────
router.use('/products', productsRouter)
router.use('/categories', categoriesRouter)

// ── Cart & Checkout ───────────────────────────────────────
router.use('/cart', cartRouter)
// router.use('/checkout', checkoutRouter)  // Phase 5

// ── Orders ────────────────────────────────────────────────
router.use('/orders', ordersRouter)

// ── Payments ──────────────────────────────────────────────
router.use('/payments', paymentsRouter)

// ── Uploads ───────────────────────────────────────────────
// router.use('/uploads', uploadsRouter)    // Phase 9

// ── Reviews ───────────────────────────────────────────────
router.use('/reviews', reviewsRouter)

// ── Wishlist ──────────────────────────────────────────────
router.use('/wishlist', wishlistRouter)

// ── Inventory ─────────────────────────────────────────────
router.use('/inventory', inventoryRouter)

// ── Admin ─────────────────────────────────────────────────
// router.use('/admin', adminRouter)        // Phase 6

export default router
