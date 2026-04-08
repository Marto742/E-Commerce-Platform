import { S3Client } from '@aws-sdk/client-s3'
import { env } from '@/config/env'

/**
 * Cloudflare R2 client (S3-compatible).
 * Returns null when R2 env vars are not configured (local dev without storage).
 */
export function getR2Client(): S3Client | null {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    return null
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
}

export function getPublicUrl(key: string): string {
  const base = env.R2_PUBLIC_URL ?? ''
  return `${base.replace(/\/$/, '')}/${key}`
}

export const BUCKET = env.R2_BUCKET_NAME ?? ''
