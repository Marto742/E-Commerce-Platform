import { prisma } from '@/lib/prisma'

interface RecordSearchInput {
  query: string
  resultCount: number
  userId?: string | null
}

/**
 * Records a search event for analytics. Fire-and-forget — a logging failure
 * must never affect the user-facing request.
 */
export function recordSearchEvent({ query, resultCount, userId }: RecordSearchInput): void {
  const trimmed = query.trim()
  if (!trimmed) return

  prisma.searchEvent
    .create({
      data: {
        query: trimmed,
        normalized: trimmed.toLowerCase(),
        resultCount,
        userId: userId ?? null,
      },
    })
    .catch(() => {
      // analytics is best-effort
    })
}
