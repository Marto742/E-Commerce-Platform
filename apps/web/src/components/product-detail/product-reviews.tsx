'use client'

import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { StarRating } from '@/components/ui/star-rating'
import { useProductReviews, useRatingSummary } from '@/hooks/use-reviews'

interface ProductReviewsProps {
  productId: string
  reviewCount: number
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-muted-foreground">{star}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-warning transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
    </div>
  )
}

export function ProductReviews({ productId, reviewCount }: ProductReviewsProps) {
  const [page, setPage] = useState(1)
  const { data: summary } = useRatingSummary(productId)
  const { data: reviewsPage, isLoading } = useProductReviews(productId, { page, limit: 5 })

  if (reviewCount === 0) {
    return (
      <section className="border-t pt-8">
        <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
        <p className="text-muted-foreground">No reviews yet.</p>
      </section>
    )
  }

  const reviews = reviewsPage?.data ?? []
  const meta = reviewsPage?.meta

  return (
    <section className="border-t pt-8">
      <h2 className="mb-6 text-xl font-semibold">Reviews</h2>

      {/* Summary */}
      {summary && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-10">
          {/* Average score */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl font-bold text-foreground">
              {(summary.avgRating ?? 0).toFixed(1)}
            </span>
            <StarRating rating={summary.avgRating} size="md" />
            <span className="text-sm text-muted-foreground">{summary.totalReviews} reviews</span>
          </div>

          {/* Distribution bars */}
          <div className="flex w-full max-w-xs flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const entry = summary.distribution.find((d) => d.rating === star)
              return (
                <RatingBar
                  key={star}
                  star={star}
                  count={entry?.count ?? 0}
                  total={summary.totalReviews}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border p-4">
              <div className="mb-2 h-3 w-24 rounded bg-muted" />
              <div className="mb-1 h-4 w-1/2 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          {reviews.map((review) => (
            <article key={review.id} className="py-5">
              <div className="mb-1 flex items-center gap-2">
                <StarRating rating={review.rating} />
                {review.isVerifiedPurchase && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <BadgeCheck className="size-3.5" />
                    Verified purchase
                  </span>
                )}
              </div>
              {review.title && <p className="mb-1 font-semibold text-foreground">{review.title}</p>}
              {review.body && (
                <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {review.user.name ?? 'Anonymous'} · {formatDate(review.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!meta.hasPrevPage}
            className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-muted"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNextPage}
            className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-muted"
          >
            Next
          </button>
        </div>
      )}
    </section>
  )
}
