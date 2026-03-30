// Auth
export {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './schemas/auth'
export type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from './schemas/auth'

// User
export { updateProfileSchema, createAddressSchema, updateAddressSchema } from './schemas/user'
export type { UpdateProfileInput, CreateAddressInput, UpdateAddressInput } from './schemas/user'

// Product
export {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  createCategorySchema,
  updateCategorySchema,
  productQuerySchema,
} from './schemas/product'
export type {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  ProductQueryInput,
} from './schemas/product'

// Cart
export { addToCartSchema, updateCartItemSchema, removeFromCartSchema } from './schemas/cart'
export type { AddToCartInput, UpdateCartItemInput, RemoveFromCartInput } from './schemas/cart'

// Order
export { createOrderSchema, updateOrderStatusSchema, orderQuerySchema } from './schemas/order'
export type { CreateOrderInput, UpdateOrderStatusInput, OrderQueryInput } from './schemas/order'

// Review
export { createReviewSchema, updateReviewSchema } from './schemas/review'
export type { CreateReviewInput, UpdateReviewInput } from './schemas/review'

// Coupon
export { createCouponSchema, updateCouponSchema, applyCouponSchema } from './schemas/coupon'
export type { CreateCouponInput, UpdateCouponInput, ApplyCouponInput } from './schemas/coupon'

// Common
export { paginationSchema, idParamSchema, slugParamSchema } from './schemas/common'
export type { PaginationInput, IdParamInput, SlugParamInput } from './schemas/common'
