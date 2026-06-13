import 'dotenv/config'
import { spawn } from 'node:child_process'
import { createGzip } from 'node:zlib'
import { Upload } from '@aws-sdk/lib-storage'
import { env } from '../config/env'
import { getR2Client, BUCKET } from '../lib/r2'
import { logger } from '../lib/logger'

/**
 * Offsite database backup: `pg_dump` → gzip → Cloudflare R2.
 *
 * Usage: pnpm --filter @repo/api db:backup
 *
 * Requires `pg_dump` on PATH (version >= the server's major version) and the R2_*
 * env vars. Neon PITR is the primary safety net; this produces a portable,
 * provider-independent copy. Restore: `aws s3 cp … - | gunzip | psql "$DATABASE_URL"`.
 */
async function main() {
  const r2 = getR2Client()
  if (!r2 || !BUCKET) {
    logger.error(
      '[backup] R2 is not configured — set R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET_NAME'
    )
    process.exit(1)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const key = `backups/db/${timestamp}.sql.gz`
  const start = Date.now()

  const dump = spawn('pg_dump', ['-d', env.DATABASE_URL, '--no-owner', '--no-privileges'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stderr = ''
  dump.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
  })

  const body = dump.stdout.pipe(createGzip())

  const upload = new Upload({
    client: r2,
    params: { Bucket: BUCKET, Key: key, Body: body, ContentType: 'application/gzip' },
  })

  const [exitCode] = await Promise.all([
    new Promise<number>((resolve, reject) => {
      dump.on('error', reject)
      dump.on('close', resolve)
    }),
    upload.done(),
  ])

  if (exitCode !== 0) {
    logger.error('[backup] pg_dump failed', { exitCode, stderr: stderr.slice(0, 1000) })
    process.exit(1)
  }

  logger.info('[backup] complete', { key, bucket: BUCKET, durationMs: Date.now() - start })
}

main().catch((err) => {
  logger.error('[backup] unexpected error', { error: (err as Error).message })
  process.exit(1)
})
