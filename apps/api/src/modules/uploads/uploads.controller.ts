import type { RequestHandler } from 'express'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { AppError } from '@/utils/AppError'
import { sendSuccess } from '@/utils/response'
import { getR2Client, getPublicUrl, BUCKET } from '@/lib/r2'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

const presignSchema = z.object({
  contentType: z.string().refine((t) => ALLOWED_TYPES.includes(t), {
    message: `contentType must be one of: ${ALLOWED_TYPES.join(', ')}`,
  }),
  contentLength: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_BYTES, `File must be ≤ ${MAX_BYTES / 1024 / 1024} MB`),
  folder: z.enum(['products', 'categories']).default('products'),
})

const deleteSchema = z.object({
  key: z.string().min(1),
})

/**
 * POST /uploads/presign
 * Returns a short-lived presigned PUT URL so the browser can upload
 * directly to R2 without routing the binary through this server.
 */
export const presign: RequestHandler = async (req, res, next) => {
  try {
    const r2 = getR2Client()
    if (!r2) {
      throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Object storage is not configured')
    }

    const { contentType, contentLength, folder } = presignSchema.parse(req.body)

    const ext = contentType.split('/')[1] ?? 'jpg'
    const key = `${folder}/${randomUUID()}.${ext}`

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    })

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 }) // 5 min

    sendSuccess(res, {
      uploadUrl,
      key,
      publicUrl: getPublicUrl(key),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /uploads
 * Removes an object from R2 by key. Called after an image is disassociated
 * from a product so orphaned files don't accumulate.
 */
export const remove: RequestHandler = async (req, res, next) => {
  try {
    const r2 = getR2Client()
    if (!r2) {
      throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Object storage is not configured')
    }

    const { key } = deleteSchema.parse(req.body)

    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
