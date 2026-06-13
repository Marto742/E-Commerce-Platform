import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Database — required (local: native PostgreSQL; prod: Neon)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis — required (local: native Redis; prod: Upstash)
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT — required
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS — comma-separated origins
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),

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

  // Search — Meilisearch (local: native binary; prod: Meilisearch Cloud)
  MEILISEARCH_URL: z.string().default('http://localhost:7700'),
  MEILISEARCH_KEY: z.string().default('meilisearch-dev-key'),

  // Error tracking — Sentry (Phase 9; optional, no-op when unset)
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  APP_VERSION: z.string().optional(),
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
