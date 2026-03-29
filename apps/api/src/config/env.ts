import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(4000),

  // Database — required (set up in Task 2.6 Docker)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis — required (set up in Task 2.6 Docker)
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT — required
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS — comma-separated origins
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://localhost:3001'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Resend (email)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@yourdomain.com'),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('\n❌  Invalid environment variables:\n')
  const errors = parsed.error.flatten().fieldErrors
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`   ${field}: ${messages?.join(', ')}`)
  })
  console.error('\n   → Copy .env.example to .env and fill in the values.\n')
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
