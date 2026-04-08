'use client'

import { useRef, useState, useTransition } from 'react'

interface ProductImage {
  id: string
  url: string
  altText: string | null
  sortOrder: number
}

interface PresignResponse {
  data: { uploadUrl: string; key: string; publicUrl: string }
}

interface Props {
  productId: string
  images: ProductImage[]
}

export function ImageUploader({ productId, images: initialImages }: Props) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError(`"${file.name}" is not an image.`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" exceeds the 5 MB limit.`)
          continue
        }

        // 1. Get presigned URL from the API
        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: file.type,
            contentLength: file.size,
            folder: 'products',
          }),
        })

        if (!presignRes.ok) {
          const json = (await presignRes.json().catch(() => ({}))) as {
            error?: { message?: string }
          }
          throw new Error(json.error?.message ?? 'Could not get upload URL')
        }

        const { data } = (await presignRes.json()) as PresignResponse

        // 2. Upload directly to R2
        const uploadRes = await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!uploadRes.ok) {
          throw new Error('Upload to storage failed')
        }

        // 3. Attach the URL to the product
        const attachRes = await fetch(`/api/products/${productId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: data.publicUrl }),
        })

        if (!attachRes.ok) {
          throw new Error('Could not save image to product')
        }

        const { data: newImage } = (await attachRes.json()) as { data: ProductImage }
        setImages((prev) => [...prev, newImage])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleDelete(imageId: string) {
    if (!confirm('Remove this image?')) return
    startTransition(async () => {
      const res = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId))
      } else {
        setError('Could not remove image')
      }
    })
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.id} className="group relative aspect-square">
              <img
                src={img.url}
                alt={img.altText ?? `Image ${i + 1}`}
                className="h-full w-full rounded-lg object-cover"
              />
              <button
                onClick={() => handleDelete(img.id)}
                disabled={isPending}
                className="absolute right-1 top-1 hidden rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white group-hover:flex"
              >
                ✕
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-xs text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
          uploading
            ? 'border-blue-300 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void handleFiles(e.dataTransfer.files)
        }}
      >
        {uploading ? (
          <p className="text-sm text-blue-600">Uploading…</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">
              Drop images here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-400">JPEG, PNG, WebP · max 5 MB each</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  )
}
